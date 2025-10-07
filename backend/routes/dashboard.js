const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

const router = express.Router();

// @route   GET /api/dashboard/test
// @desc    Test endpoint to check if user has transactions
// @access  Private
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('Test endpoint - userId:', userId);
    
    const transactions = await Transaction.find({ userId: userId }).limit(5);
    console.log('Sample transactions:', transactions);
    
    res.json({
      status: 'success',
      data: {
        userId: userId,
        transactionCount: transactions.length,
        sampleTransactions: transactions
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/dashboard/create-sample-data
// @desc    Create sample transactions for testing
// @access  Private
router.post('/create-sample-data', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('Creating sample data for userId:', userId);
    
    // Check if user already has transactions
    const existingCount = await Transaction.countDocuments({ userId: userId });
    if (existingCount > 0) {
      return res.json({
        status: 'success',
        message: 'User already has transactions',
        data: { existingCount }
      });
    }
    
    // Create sample transactions for October 2025
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // October = 9 (0-indexed)
    
    const sampleTransactions = [
      {
        userId: userId,
        type: 'income',
        amount: 5000,
        currency: 'INR',
        category: 'Salary',
        date: new Date(currentYear, currentMonth, 1), // Oct 1st
        paymentMethod: 'bank',
        notes: 'Monthly salary',
        status: 'completed'
      },
      {
        userId: userId,
        type: 'expense',
        amount: 1200,
        currency: 'INR',
        category: 'Food',
        date: new Date(currentYear, currentMonth, 2), // Oct 2nd
        paymentMethod: 'card',
        notes: 'Grocery shopping',
        status: 'completed'
      },
      {
        userId: userId,
        type: 'expense',
        amount: 800,
        currency: 'INR',
        category: 'Transport',
        date: new Date(currentYear, currentMonth, 3), // Oct 3rd
        paymentMethod: 'upi',
        notes: 'Uber rides',
        status: 'completed'
      },
      {
        userId: userId,
        type: 'income',
        amount: 2000,
        currency: 'INR',
        category: 'Freelance',
        date: new Date(currentYear, currentMonth, 4), // Oct 4th
        paymentMethod: 'bank',
        notes: 'Freelance project',
        status: 'completed'
      },
      {
        userId: userId,
        type: 'expense',
        amount: 500,
        currency: 'INR',
        category: 'Entertainment',
        date: new Date(currentYear, currentMonth, 5), // Oct 5th
        paymentMethod: 'cash',
        notes: 'Movie tickets',
        status: 'completed'
      },
      {
        userId: userId,
        type: 'expense',
        amount: 300,
        currency: 'INR',
        category: 'Shopping',
        date: new Date(currentYear, currentMonth, 6), // Oct 6th
        paymentMethod: 'card',
        notes: 'Clothes shopping',
        status: 'completed'
      }
    ];
    
    const createdTransactions = await Transaction.insertMany(sampleTransactions);
    console.log('Created sample transactions:', createdTransactions.length);
    
    res.json({
      status: 'success',
      message: 'Sample transactions created successfully',
      data: {
        createdCount: createdTransactions.length,
        transactions: createdTransactions
      }
    });
  } catch (error) {
    console.error('Create sample data error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   DELETE /api/dashboard/clear-data
// @desc    Clear all transactions for testing
// @access  Private
router.delete('/clear-data', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('Clearing data for userId:', userId);
    
    const result = await Transaction.deleteMany({ userId: userId });
    console.log('Deleted transactions:', result.deletedCount);
    
    res.json({
      status: 'success',
      message: 'All transactions cleared successfully',
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('Dashboard stats - userId:', userId);
    
    // Check if user has any transactions at all
    const totalTransactions = await Transaction.countDocuments({ userId: userId });
    console.log('Total transactions for user:', totalTransactions);
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get today's transactions
    const todayStats = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startOfToday },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Get this month's stats
    const thisMonthStats = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Get last month's stats for comparison
    const lastMonthStats = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Get recent transactions count (last 7 days)
    const recentTransactions = await Transaction.countDocuments({
      userId: userId,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: 'completed'
    });

    const todayData = todayStats[0] || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };
    const thisMonthData = thisMonthStats[0] || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };
    const lastMonthData = lastMonthStats[0] || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };

    // Calculate percentages
    const calculatePercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const todayBalance = todayData.totalIncome - todayData.totalExpenses;
    const incomePercentage = calculatePercentage(thisMonthData.totalIncome, lastMonthData.totalIncome);
    const expensePercentage = calculatePercentage(thisMonthData.totalExpenses, lastMonthData.totalExpenses);
    const transactionPercentage = calculatePercentage(thisMonthData.transactionCount, lastMonthData.transactionCount);

    const dashboardStats = {
      todaysMoney: {
        amount: todayBalance,
        percentage: incomePercentage,
        trend: incomePercentage >= 0 ? 'up' : 'down'
      },
      monthlyIncome: {
        amount: thisMonthData.totalIncome,
        percentage: incomePercentage,
        trend: incomePercentage >= 0 ? 'up' : 'down'
      },
      recentTransactions: {
        amount: recentTransactions,
        percentage: transactionPercentage,
        trend: transactionPercentage >= 0 ? 'up' : 'down'
      },
      totalExpenses: {
        amount: thisMonthData.totalExpenses,
        percentage: expensePercentage,
        trend: expensePercentage >= 0 ? 'up' : 'down'
      }
    };

    res.json({
      status: 'success',
      data: {
        stats: dashboardStats
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// @route   GET /api/dashboard/charts/overview
// @desc    Get transaction overview chart data
// @access  Private
router.get('/charts/overview', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const currentYear = new Date().getFullYear();
    
    // Get monthly transaction data for the current year
    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Initialize arrays for 12 months
    const incomeData = new Array(12).fill(0);
    const expenseData = new Array(12).fill(0);
    
    // Fill in the actual data
    console.log('Raw monthly data:', monthlyData);
    monthlyData.forEach(item => {
      const monthIndex = item._id.month - 1;
      console.log(`Processing month ${item._id.month} (index ${monthIndex}) for ${item._id.type}: ${item.total}`);
      if (item._id.type === 'income') {
        incomeData[monthIndex] = item.total;
      } else if (item._id.type === 'expense') {
        expenseData[monthIndex] = item.total;
      }
    });

    console.log('Final income data:', incomeData);
    console.log('Final expense data:', expenseData);

    const overviewChartData = [
      {
        name: 'Income',
        data: incomeData
      },
      {
        name: 'Expenses', 
        data: expenseData
      }
    ];

    res.json({
      status: 'success',
      data: {
        chartData: overviewChartData
      }
    });

  } catch (error) {
    console.error('Get overview chart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching overview chart data'
    });
  }
});

// @route   GET /api/dashboard/charts/performance
// @desc    Get expense category performance chart data
// @access  Private
router.get('/charts/performance', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    // Get category-wise expense data for current month
    let categoryData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'expense',
          date: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 6 // Top 6 categories
      }
    ]);

    // If no data for current month, get all-time expense data
    if (categoryData.length === 0) {
      console.log('No current month data, fetching all-time expense data');
      categoryData = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            type: 'expense',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        },
        {
          $sort: { total: -1 }
        },
        {
          $limit: 6 // Top 6 categories
        }
      ]);
    }

    const labels = categoryData.map(item => item._id || 'Other');
    const data = categoryData.map(item => item.total);

    console.log('Performance chart - categoryData:', categoryData);
    console.log('Performance chart - labels:', labels);
    console.log('Performance chart - data:', data);

    const performanceChartData = [
      {
        name: 'Expenses',
        data: data
      }
    ];

    const responseData = {
      status: 'success',
      data: {
        chartData: performanceChartData,
        categories: labels
      }
    };

    console.log('Sending performance response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('Get performance chart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching performance chart data'
    });
  }
});

// @route   GET /api/dashboard/recent-income
// @desc    Get recent income transactions
// @access  Private
router.get('/recent-income', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const recentIncome = await Transaction.find({
      userId: userId,
      type: 'income',
      status: 'completed'
    })
    .sort({ date: -1 })
    .limit(5)
    .lean();

    const formattedIncome = recentIncome.map(transaction => ({
      source: transaction.category || 'Income',
      amount: `₹${transaction.amount.toLocaleString()}`,
      date: new Date(transaction.date).toLocaleDateString(),
      status: transaction.status,
      percentage: Math.floor(Math.random() * 100) // Placeholder for growth percentage
    }));

    res.json({
      status: 'success',
      data: {
        recentIncome: formattedIncome
      }
    });

  } catch (error) {
    console.error('Get recent income error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching recent income data'
    });
  }
});

// @route   GET /api/dashboard/recent-expenses
// @desc    Get recent expense transactions by category
// @access  Private
router.get('/recent-expenses', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Get expense data grouped by category
    const expensesByCategory = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'expense',
          status: 'completed',
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.totalAmount, 0);

    const formattedExpenses = expensesByCategory.map(category => ({
      category: category._id || 'Other',
      amount: `₹${category.totalAmount.toLocaleString()}`,
      percentage: totalExpenses > 0 ? Math.round((category.totalAmount / totalExpenses) * 100) : 0,
      color: ['orange', 'cyan', 'purple', 'green', 'red'][Math.floor(Math.random() * 5)]
    }));

    res.json({
      status: 'success',
      data: {
        recentExpenses: formattedExpenses
      }
    });

  } catch (error) {
    console.error('Get recent expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching recent expenses data'
    });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity data
// @access  Private
router.get('/recent-activity', authenticateToken, (req, res) => {
  try {
    const recentActivity = [
      {
        id: '1',
        type: 'transaction',
        title: '$2400, Design changes',
        date: '22 DEC 7:20 PM',
        icon: 'bell',
        color: 'teal.300'
      },
      {
        id: '2',
        type: 'order',
        title: 'New order #4219423',
        date: '21 DEC 11:21 PM',
        icon: 'html5',
        color: 'orange'
      },
      {
        id: '3',
        type: 'payment',
        title: 'Server Payments for April',
        date: '21 DEC 9:28 PM',
        icon: 'cart',
        color: 'blue.400'
      },
      {
        id: '4',
        type: 'card',
        title: 'New card added for order #3210145',
        date: '20 DEC 3:52 PM',
        icon: 'credit-card',
        color: 'orange.300'
      },
      {
        id: '5',
        type: 'package',
        title: 'Unlock packages for Development',
        date: '19 DEC 11:35 PM',
        icon: 'dropbox',
        color: 'purple'
      }
    ];

    res.json({
      status: 'success',
      data: {
        activities: recentActivity
      }
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching recent activity data'
    });
  }
});

// @route   GET /api/dashboard/overview
// @desc    Get complete dashboard overview
// @access  Private
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const overview = {
      stats: {
        todaysMoney: {
          amount: 53897,
          percentage: 3.48,
          trend: 'up'
        },
        todaysUsers: {
          amount: 3200,
          percentage: 5.2,
          trend: 'up'
        },
        newClients: {
          amount: 2503,
          percentage: -2.82,
          trend: 'down'
        },
        totalSales: {
          amount: 173000,
          percentage: 8.12,
          trend: 'up'
        }
      },
      quickStats: {
        totalTransactions: 156,
        totalInvoices: 23,
        pendingPayments: 8,
        activeProjects: 12
      },
      recentTransactions: [
        {
          id: '1',
          name: 'Netflix',
          amount: -25.00,
          date: '2024-03-27',
          status: 'completed'
        },
        {
          id: '2',
          name: 'Apple Store',
          amount: 99.99,
          date: '2024-03-26',
          status: 'completed'
        },
        {
          id: '3',
          name: 'Stripe Payment',
          amount: 1250.00,
          date: '2024-03-25',
          status: 'completed'
        }
      ]
    };

    res.json({
      status: 'success',
      data: {
        overview
      }
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching dashboard overview'
    });
  }
});

module.exports = router;
