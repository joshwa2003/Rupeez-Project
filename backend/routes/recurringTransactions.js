const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');

// Handle preflight requests for all routes
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// @route   GET /api/recurring-transactions
// @desc    Get all recurring transactions for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    
    if (status) filter.status = status;
    
    const recurring = await RecurringTransaction.find(filter)
      .sort({ nextOccurrence: 1 })
      .lean();
    
    res.json({
      status: 'success',
      data: { recurring }
    });
  } catch (error) {
    console.error('Get recurring transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while fetching recurring transactions'
    });
  }
});

// @route   GET /api/recurring-transactions/:id
// @desc    Get single recurring transaction
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).lean();
    
    if (!recurring) {
      return res.status(404).json({
        status: 'error',
        message: 'Recurring transaction not found'
      });
    }
    
    res.json({
      status: 'success',
      data: { recurring }
    });
  } catch (error) {
    console.error('Get recurring transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while fetching recurring transaction'
    });
  }
});

// @route   POST /api/recurring-transactions
// @desc    Create new recurring transaction
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      type, amount, currency, category, paymentMethod, notes,
      frequency, interval, dayOfMonth, dayOfWeek,
      startDate, endDate, autoApprove, notifyUser, notificationMethod
    } = req.body;
    
    // Validation
    if (!type || !amount || !category || !frequency || !startDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: type, amount, category, frequency, startDate'
      });
    }
    
    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Type must be either income or expense'
      });
    }
    
    // Validate frequency
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({
        status: 'error',
        message: 'Frequency must be daily, weekly, monthly, or yearly'
      });
    }
    
    // Calculate first occurrence
    const nextOccurrence = new Date(startDate);
    
    const recurring = new RecurringTransaction({
      userId: req.user.id,
      type,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      category,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      frequency,
      interval: interval || 1,
      dayOfMonth: dayOfMonth || null,
      dayOfWeek: dayOfWeek || null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      nextOccurrence,
      autoApprove: autoApprove !== false,
      notifyUser: notifyUser !== false,
      notificationMethod: notificationMethod || 'in-app',
      status: 'active'
    });
    
    await recurring.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Recurring transaction created successfully',
      data: { recurring }
    });
  } catch (error) {
    console.error('Create recurring transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while creating recurring transaction'
    });
  }
});

// @route   PUT /api/recurring-transactions/:id
// @desc    Update recurring transaction
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!recurring) {
      return res.status(404).json({
        status: 'error',
        message: 'Recurring transaction not found'
      });
    }
    
    // Update allowed fields (don't allow changing frequency or start date)
    const allowedUpdates = [
      'amount', 'category', 'paymentMethod', 'notes', 
      'endDate', 'autoApprove', 'notifyUser', 'notificationMethod'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        recurring[field] = req.body[field];
      }
    });
    
    await recurring.save();
    
    res.json({
      status: 'success',
      message: 'Recurring transaction updated successfully',
      data: { recurring }
    });
  } catch (error) {
    console.error('Update recurring transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while updating recurring transaction'
    });
  }
});

// @route   PATCH /api/recurring-transactions/:id/pause
// @desc    Pause recurring transaction
// @access  Private
router.patch('/:id/pause', authenticateToken, async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'paused' },
      { new: true }
    );
    
    if (!recurring) {
      return res.status(404).json({
        status: 'error',
        message: 'Recurring transaction not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Recurring transaction paused successfully',
      data: { recurring }
    });
  } catch (error) {
    console.error('Pause recurring transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while pausing recurring transaction'
    });
  }
});

// @route   PATCH /api/recurring-transactions/:id/resume
// @desc    Resume recurring transaction
// @access  Private
router.patch('/:id/resume', authenticateToken, async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'active' },
      { new: true }
    );
    
    if (!recurring) {
      return res.status(404).json({
        status: 'error',
        message: 'Recurring transaction not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Recurring transaction resumed successfully',
      data: { recurring }
    });
  } catch (error) {
    console.error('Resume recurring transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while resuming recurring transaction'
    });
  }
});

// @route   DELETE /api/recurring-transactions/:id
// @desc    Delete recurring transaction
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!recurring) {
      return res.status(404).json({
        status: 'error',
        message: 'Recurring transaction not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Recurring transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete recurring transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while deleting recurring transaction'
    });
  }
});

// @route   GET /api/recurring-transactions/:id/history
// @desc    Get transaction history for a recurring transaction
// @access  Private
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Verify recurring transaction belongs to user
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!recurring) {
      return res.status(404).json({
        status: 'error',
        message: 'Recurring transaction not found'
      });
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);
    
    // Get transactions
    const transactions = await Transaction.find({
      userId: req.user.id,
      recurringTransactionId: req.params.id
    })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();
    
    // Get total count
    const totalItems = await Transaction.countDocuments({
      userId: req.user.id,
      recurringTransactionId: req.params.id
    });
    
    const totalPages = Math.ceil(totalItems / limitNum);
    
    res.json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get recurring transaction history error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while fetching transaction history'
    });
  }
});

// @route   GET /api/recurring-transactions/stats/summary
// @desc    Get recurring transactions statistics
// @access  Private
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await RecurringTransaction.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const summary = {
      active: 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
      totalActive: 0,
      totalMonthlyIncome: 0,
      totalMonthlyExpense: 0
    };
    
    stats.forEach(stat => {
      summary[stat._id] = stat.count;
    });
    
    // Calculate monthly projections
    const activeRecurring = await RecurringTransaction.find({
      userId: userId,
      status: 'active'
    });
    
    activeRecurring.forEach(rec => {
      let monthlyAmount = rec.amount;
      
      // Convert to monthly equivalent
      switch(rec.frequency) {
        case 'daily':
          monthlyAmount = rec.amount * 30;
          break;
        case 'weekly':
          monthlyAmount = rec.amount * 4;
          break;
        case 'yearly':
          monthlyAmount = rec.amount / 12;
          break;
      }
      
      if (rec.type === 'income') {
        summary.totalMonthlyIncome += monthlyAmount;
      } else {
        summary.totalMonthlyExpense += monthlyAmount;
      }
    });
    
    summary.totalActive = activeRecurring.length;
    
    res.json({
      status: 'success',
      data: { summary }
    });
  } catch (error) {
    console.error('Get recurring transaction stats error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while fetching statistics'
    });
  }
});

module.exports = router;
