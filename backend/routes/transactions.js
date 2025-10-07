const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const transactionAttachmentService = require('../services/transactionAttachmentService');

const router = express.Router();

// Configure multer for memory storage (we'll upload to Supabase instead of disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow only image files and PDFs
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF) and PDF files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Initialize Supabase bucket on startup
(async () => {
  try {
    await transactionAttachmentService.createBucketIfNotExists();
    console.log('Transaction attachments bucket initialized');
  } catch (error) {
    console.error('Failed to initialize transaction attachments bucket:', error);
  }
})();

// @route   GET /api/transactions
// @desc    Get all transactions for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, category } = req.query;
    
    // Build query filter
    const filter = { userId: req.user.id };
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (category) filter.category = new RegExp(category, 'i');

    // Calculate pagination
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Get transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalItems = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Format transactions for frontend compatibility
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id.toString(),
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency || 'INR',
      category: transaction.category,
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes,
      status: transaction.status,
      attachment: transaction.attachment,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }));

    res.json({
      status: 'success',
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          itemsPerPage: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching transactions'
    });
  }
});

// Advanced Search and Filter Routes (MUST be before /:id route)

/**
 * @route   GET /api/transactions/search
 * @desc    Advanced search and filter transactions
 * @access  Private
 */
router.get('/search', authenticateToken, async (req, res) => {
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
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build MongoDB query conditions
    const matchConditions = {
      userId: userId
    };

    // Keyword search (notes field - assuming description is stored in notes)
    if (keyword.trim()) {
      matchConditions.$or = [
        { notes: { $regex: keyword.trim(), $options: 'i' } },
        { category: { $regex: keyword.trim(), $options: 'i' } }
      ];
    }

    // Amount range filter
    if (amountMin || amountMax) {
      matchConditions.amount = {};
      if (amountMin) {
        matchConditions.amount.$gte = parseFloat(amountMin);
      }
      if (amountMax) {
        matchConditions.amount.$lte = parseFloat(amountMax);
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      matchConditions.date = {};
      if (dateFrom) {
        matchConditions.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        matchConditions.date.$lt = endDate;
      }
    }

    // Category filter
    let categoryNames = [];
    if (Array.isArray(categories)) {
      // Handle array format: categories[]=Transportation&categories[]=Gift
      categoryNames = categories.filter(name => name && name.trim());
    } else if (typeof categories === 'string' && categories.trim()) {
      // Handle comma-separated string format: categories=Transportation,Gift
      categoryNames = categories.split(',').map(name => name.trim()).filter(name => name);
    }
    
    if (categoryNames.length > 0) {
      matchConditions.category = { $in: categoryNames };
    }

    // Transaction type filter
    if (transactionType && ['income', 'expense'].includes(transactionType.toLowerCase())) {
      matchConditions.type = transactionType.toLowerCase();
    }

    // Build sort object
    const validSortFields = ['date', 'amount', 'notes', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;
    const sortObj = { [sortField]: sortDirection };

    // Execute search query with pagination
    const transactions = await Transaction.find(matchConditions)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(matchConditions);

    // Calculate statistics using aggregation
    const statsResult = await Transaction.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    const stats = statsResult[0] || {
      totalCount: 0,
      totalIncome: 0,
      totalExpense: 0
    };

    // Calculate net amount (income - expense)
    const netAmount = (stats.totalIncome || 0) - (stats.totalExpense || 0);

    // Format response
    const response = {
      success: true,
      data: {
        transactions: transactions.map(transaction => ({
          id: transaction._id,
          description: transaction.notes || '', // Using notes as description
          amount: parseFloat(transaction.amount),
          type: transaction.type,
          date: transaction.date,
          notes: transaction.notes || '',
          category: transaction.category, // Keep as string to match existing frontend
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        })),
        pagination: {
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
          totalCount: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          hasNext: skip + parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        },
        statistics: {
          totalCount: stats.totalCount || 0,
          totalAmount: netAmount,
          incomeAmount: stats.totalIncome || 0,
          expenseAmount: stats.totalExpense || 0,
          netAmount: netAmount
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
router.get('/search/suggestions', authenticateToken, async (req, res) => {
  try {
    const { query = '', limit = 10 } = req.query;
    const userId = req.user.id;

    // Get unique categories and notes that match the query using aggregation
    const suggestions = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          $or: [
            { notes: { $regex: query.trim(), $options: 'i' } },
            { category: { $regex: query.trim(), $options: 'i' } }
          ]
        }
      },
      {
        $group: {
          _id: '$notes',
          frequency: { $sum: 1 }
        }
      },
      {
        $sort: { frequency: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map(s => ({
          text: s._id,
          frequency: s.frequency
        })).filter(s => s.text && s.text.trim()) // Filter out empty suggestions
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

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).lean();

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Format transaction for frontend compatibility
    const formattedTransaction = {
      id: transaction._id.toString(),
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency || 'USD',
      category: transaction.category,
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes,
      status: transaction.status,
      attachment: transaction.attachment,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };

    res.json({
      status: 'success',
      data: {
        transaction: formattedTransaction
      }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching transaction'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    const { type, amount, currency, category, date, paymentMethod, notes } = req.body;

    // Basic validation
    if (!type || !amount || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide type, amount, and category'
      });
    }

    // Create new transaction first to get the ID
    const newTransaction = new Transaction({
      userId: req.user.id,
      type,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      category,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      status: 'completed',
      attachment: null // Will be updated after file upload
    });

    // Save to database to get the transaction ID
    const savedTransaction = await newTransaction.save();

    // Handle file attachment upload to Supabase
    let attachmentUrl = null;
    if (req.file) {
      // Validate file
      const validation = transactionAttachmentService.validateAttachment(req.file.originalname, req.file.size);
      if (!validation.valid) {
        // Delete the transaction if file validation fails
        await Transaction.findByIdAndDelete(savedTransaction._id);
        return res.status(400).json({
          status: 'error',
          message: validation.error
        });
      }

      // Upload to Supabase
      const uploadResult = await transactionAttachmentService.uploadAttachment(
        req.file.buffer,
        req.file.originalname,
        req.user.id,
        savedTransaction._id.toString()
      );

      if (!uploadResult.success) {
        // Delete the transaction if upload fails
        await Transaction.findByIdAndDelete(savedTransaction._id);
        return res.status(500).json({
          status: 'error',
          message: uploadResult.error || 'Failed to upload attachment'
        });
      }

      attachmentUrl = uploadResult.url;

      // Update transaction with attachment URL
      savedTransaction.attachment = attachmentUrl;
      await savedTransaction.save();
    }

    // Format for frontend compatibility
    const formattedTransaction = {
      id: savedTransaction._id.toString(),
      type: savedTransaction.type,
      amount: savedTransaction.amount,
      currency: savedTransaction.currency || 'USD',
      category: savedTransaction.category,
      date: savedTransaction.date,
      paymentMethod: savedTransaction.paymentMethod,
      notes: savedTransaction.notes,
      status: savedTransaction.status,
      attachment: savedTransaction.attachment,
      createdAt: savedTransaction.createdAt,
      updatedAt: savedTransaction.updatedAt
    };

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: {
        transaction: formattedTransaction
      }
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while creating transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    const { type, amount, category, date, paymentMethod, notes, status } = req.body;

    // Find existing transaction first
    const existingTransaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!existingTransaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Handle file attachment upload to Supabase
    let attachmentUrl = undefined;
    if (req.file) {
      // Validate file
      const validation = transactionAttachmentService.validateAttachment(req.file.originalname, req.file.size);
      if (!validation.valid) {
        return res.status(400).json({
          status: 'error',
          message: validation.error
        });
      }

      // Delete old attachment if exists
      if (existingTransaction.attachment) {
        try {
          await transactionAttachmentService.deleteAttachment(existingTransaction.attachment);
        } catch (deleteError) {
          console.warn('Failed to delete old attachment:', deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new attachment to Supabase
      const uploadResult = await transactionAttachmentService.uploadAttachment(
        req.file.buffer,
        req.file.originalname,
        req.user.id,
        req.params.id
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          status: 'error',
          message: uploadResult.error || 'Failed to upload attachment'
        });
      }

      attachmentUrl = uploadResult.url;
    }

    // Build update object
    const updateData = {
      ...(type && { type }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(category && { category }),
      ...(date && { date: new Date(date) }),
      ...(paymentMethod && { paymentMethod }),
      ...(notes !== undefined && { notes }),
      ...(status && { status }),
      ...(attachmentUrl !== undefined && { attachment: attachmentUrl })
    };

    // Find and update transaction
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    // Format for frontend compatibility
    const formattedTransaction = {
      id: updatedTransaction._id.toString(),
      type: updatedTransaction.type,
      amount: updatedTransaction.amount,
      currency: updatedTransaction.currency || 'USD',
      category: updatedTransaction.category,
      date: updatedTransaction.date,
      paymentMethod: updatedTransaction.paymentMethod,
      notes: updatedTransaction.notes,
      status: updatedTransaction.status,
      attachment: updatedTransaction.attachment,
      createdAt: updatedTransaction.createdAt,
      updatedAt: updatedTransaction.updatedAt
    };

    res.json({
      status: 'success',
      message: 'Transaction updated successfully',
      data: {
        transaction: formattedTransaction
      }
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while updating transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deletedTransaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Delete attachment from Supabase storage if exists
    if (deletedTransaction.attachment) {
      try {
        await transactionAttachmentService.deleteAttachment(deletedTransaction.attachment);
      } catch (deleteError) {
        console.warn('Failed to delete attachment from storage:', deleteError);
        // Continue with transaction deletion even if attachment deletion fails
      }
    }

    res.json({
      status: 'success',
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting transaction'
    });
  }
});

// @route   GET /api/transactions/stats/summary
// @desc    Get transaction statistics
// @access  Private
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Aggregate statistics
    const stats = await Transaction.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'income'] }, { $eq: ['$status', 'completed'] }] },
                '$amount',
                0
              ]
            }
          },
          totalExpenses: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'expense'] }, { $eq: ['$status', 'completed'] }] },
                '$amount',
                0
              ]
            }
          },
          pendingTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    const summary = stats[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      pendingTransactions: 0,
      totalTransactions: 0
    };

    summary.balance = summary.totalIncome - summary.totalExpenses;

    res.json({
      status: 'success',
      data: {
        summary
      }
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching transaction statistics'
    });
  }
});


module.exports = router;
