const Transaction = require('../models/Transaction');

/**
 * Get all transactions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of transaction objects
 */
const getAllTransactions = async (userId = null) => {
  try {
    const filter = userId ? { userId } : {};

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Format transactions for export compatibility
    return transactions.map(transaction => ({
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
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
};

/**
 * Get transactions with pagination and filters
 * @param {Object} options - Query options
 * @param {string} options.userId - User ID (required)
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.type - Transaction type filter
 * @param {string} options.status - Transaction status filter
 * @param {string} options.category - Category filter (regex)
 * @returns {Promise<Object>} Paginated transactions with metadata
 */
const getTransactionsWithPagination = async (options) => {
  try {
    const { userId, page = 1, limit = 10, type, status, category } = options;

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Build query filter
    const filter = { userId };

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
      currency: transaction.currency || 'USD',
      category: transaction.category,
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes,
      status: transaction.status,
      attachment: transaction.attachment,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }));

    return {
      transactions: formattedTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: limitNum
      }
    };
  } catch (error) {
    console.error('Error fetching transactions with pagination:', error);
    throw new Error('Failed to fetch transactions');
  }
};

/**
 * Get transaction statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Transaction statistics
 */
const getTransactionStats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

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

    return summary;
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    throw new Error('Failed to fetch transaction statistics');
  }
};

/**
 * Get transactions by category
 * @param {string} userId - User ID
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of transactions in the category
 */
const getTransactionsByCategory = async (userId, category) => {
  try {
    if (!userId || !category) {
      throw new Error('User ID and category are required');
    }

    const transactions = await Transaction.find({
      userId,
      category: new RegExp(category, 'i')
    })
      .sort({ createdAt: -1 })
      .lean();

    return transactions.map(transaction => ({
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
    }));
  } catch (error) {
    console.error('Error fetching transactions by category:', error);
    throw new Error('Failed to fetch transactions by category');
  }
};

/**
 * Get transactions by date range
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of transactions in the date range
 */
const getTransactionsByDateRange = async (userId, startDate, endDate) => {
  try {
    if (!userId || !startDate || !endDate) {
      throw new Error('User ID, start date, and end date are required');
    }

    const transactions = await Transaction.find({
      userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .sort({ createdAt: -1 })
      .lean();

    return transactions.map(transaction => ({
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
    }));
  } catch (error) {
    console.error('Error fetching transactions by date range:', error);
    throw new Error('Failed to fetch transactions by date range');
  }
};

module.exports = {
  getAllTransactions,
  getTransactionsWithPagination,
  getTransactionStats,
  getTransactionsByCategory,
  getTransactionsByDateRange
};
