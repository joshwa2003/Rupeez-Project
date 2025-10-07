const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

/**
 * @route   GET /api/transactions/search
 * @desc    Advanced search and filter transactions
 * @access  Private
 */
router.get('/search', auth, async (req, res) => {
  try {
    const {
      keyword = '',
      amountMin,
      amountMax,
      dateFrom,
      dateTo,
      categories = '',
      transactionType = '',
      page = 1,
      limit = 25,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;

    const userId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = {
      userId: userId
    };

    // Keyword search (description and notes)
    if (keyword.trim()) {
      whereConditions[Op.or] = [
        {
          description: {
            [Op.iLike]: `%${keyword.trim()}%`
          }
        },
        {
          notes: {
            [Op.iLike]: `%${keyword.trim()}%`
          }
        }
      ];
    }

    // Amount range filter
    if (amountMin || amountMax) {
      whereConditions.amount = {};
      if (amountMin) {
        whereConditions.amount[Op.gte] = parseFloat(amountMin);
      }
      if (amountMax) {
        whereConditions.amount[Op.lte] = parseFloat(amountMax);
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereConditions.date = {};
      if (dateFrom) {
        whereConditions.date[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        whereConditions.date[Op.lt] = endDate;
      }
    }

    // Category filter
    if (categories.trim()) {
      const categoryIds = categories.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (categoryIds.length > 0) {
        whereConditions.categoryId = {
          [Op.in]: categoryIds
        };
      }
    }

    // Transaction type filter
    if (transactionType && ['income', 'expense'].includes(transactionType.toLowerCase())) {
      whereConditions.type = transactionType.toLowerCase();
    }

    // Build order clause
    const validSortFields = ['date', 'amount', 'description', 'createdAt'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'date';
    const orderDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Execute search query
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon']
        }
      ],
      order: [[orderField, orderDirection]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    // Calculate statistics for the filtered results
    const statsQuery = await Transaction.findAll({
      where: whereConditions,
      attributes: [
        [fn('COUNT', col('id')), 'totalCount'],
        [fn('SUM', col('amount')), 'totalAmount'],
        [fn('SUM', literal("CASE WHEN type = 'income' THEN amount ELSE 0 END")), 'totalIncome'],
        [fn('SUM', literal("CASE WHEN type = 'expense' THEN amount ELSE 0 END")), 'totalExpense']
      ],
      raw: true
    });

    const stats = statsQuery[0] || {
      totalCount: 0,
      totalAmount: 0,
      totalIncome: 0,
      totalExpense: 0
    };

    // Calculate net amount (income - expense)
    const netAmount = parseFloat(stats.totalIncome || 0) - parseFloat(stats.totalExpense || 0);

    // Format response
    const response = {
      success: true,
      data: {
        transactions: transactions.map(transaction => ({
          id: transaction.id,
          description: transaction.description,
          amount: parseFloat(transaction.amount),
          type: transaction.type,
          date: transaction.date,
          notes: transaction.notes,
          category: transaction.category ? {
            id: transaction.category.id,
            name: transaction.category.name,
            color: transaction.category.color,
            icon: transaction.category.icon
          } : null,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        })),
        pagination: {
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
          totalCount: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          hasNext: offset + parseInt(limit) < count,
          hasPrev: parseInt(page) > 1
        },
        statistics: {
          totalCount: parseInt(stats.totalCount || 0),
          totalAmount: netAmount,
          incomeAmount: parseFloat(stats.totalIncome || 0),
          expenseAmount: parseFloat(stats.totalExpense || 0),
          netAmount: netAmount
        },
        filters: {
          keyword: keyword.trim(),
          amountMin: amountMin ? parseFloat(amountMin) : null,
          amountMax: amountMax ? parseFloat(amountMax) : null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          categories: categories.trim() ? categories.split(',').map(id => parseInt(id.trim())) : [],
          transactionType: transactionType || null,
          sortBy: orderField,
          sortOrder: orderDirection
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Transaction search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/transactions/search/suggestions
 * @desc    Get search suggestions based on user's transaction history
 * @access  Private
 */
router.get('/search/suggestions', auth, async (req, res) => {
  try {
    const { query = '', limit = 10 } = req.query;
    const userId = req.user.id;

    // Get unique descriptions that match the query
    const suggestions = await Transaction.findAll({
      where: {
        userId: userId,
        description: {
          [Op.iLike]: `%${query.trim()}%`
        }
      },
      attributes: [
        [fn('DISTINCT', col('description')), 'description'],
        [fn('COUNT', col('id')), 'frequency']
      ],
      group: ['description'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: parseInt(limit),
      raw: true
    });

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map(s => ({
          text: s.description,
          frequency: parseInt(s.frequency)
        }))
      }
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/transactions/search/export
 * @desc    Export filtered transactions to CSV
 * @access  Private
 */
router.get('/search/export', auth, async (req, res) => {
  try {
    const {
      keyword = '',
      amountMin,
      amountMax,
      dateFrom,
      dateTo,
      categories = '',
      transactionType = '',
      format = 'csv'
    } = req.query;

    const userId = req.user.id;

    // Build where conditions (same as search)
    const whereConditions = {
      userId: userId
    };

    if (keyword.trim()) {
      whereConditions[Op.or] = [
        { description: { [Op.iLike]: `%${keyword.trim()}%` } },
        { notes: { [Op.iLike]: `%${keyword.trim()}%` } }
      ];
    }

    if (amountMin || amountMax) {
      whereConditions.amount = {};
      if (amountMin) whereConditions.amount[Op.gte] = parseFloat(amountMin);
      if (amountMax) whereConditions.amount[Op.lte] = parseFloat(amountMax);
    }

    if (dateFrom || dateTo) {
      whereConditions.date = {};
      if (dateFrom) whereConditions.date[Op.gte] = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        whereConditions.date[Op.lt] = endDate;
      }
    }

    if (categories.trim()) {
      const categoryIds = categories.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (categoryIds.length > 0) {
        whereConditions.categoryId = { [Op.in]: categoryIds };
      }
    }

    if (transactionType && ['income', 'expense'].includes(transactionType.toLowerCase())) {
      whereConditions.type = transactionType.toLowerCase();
    }

    // Get all matching transactions (no pagination for export)
    const transactions = await Transaction.findAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ],
      order: [['date', 'DESC']]
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Notes'];
      const csvRows = transactions.map(t => [
        t.date.toISOString().split('T')[0],
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.category?.name || 'Uncategorized'}"`,
        t.amount,
        t.type,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.json({
        success: true,
        data: {
          transactions: transactions.map(t => ({
            date: t.date,
            description: t.description,
            category: t.category?.name || 'Uncategorized',
            amount: parseFloat(t.amount),
            type: t.type,
            notes: t.notes || ''
          })),
          exportedAt: new Date().toISOString(),
          totalCount: transactions.length
        }
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
