const express = require('express');
const router = express.Router();
const SavingsGoal = require('../models/SavingsGoal');
const { authenticateToken } = require('../middleware/auth');
const savingsGoalService = require('../services/savingsGoalService');

// Get all savings goals for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const savingsGoals = await SavingsGoal.find({ 
      userId: req.user.id,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        savingsGoals,
        count: savingsGoals.length
      }
    });
  } catch (error) {
    console.error('Get savings goals error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch savings goals'
    });
  }
});

// Get savings goals statistics (must be before /:id route)
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const savingsGoals = await SavingsGoal.find({
      userId: req.user.id,
      isActive: true
    });

    const stats = {
      totalGoals: savingsGoals.length,
      activeGoals: savingsGoals.filter(goal => goal.status === 'active').length,
      completedGoals: savingsGoals.filter(goal => goal.status === 'completed').length,
      totalTargetAmount: savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      totalCurrentAmount: savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0),
      totalMonthlyTarget: savingsGoals.filter(goal => goal.status === 'active').reduce((sum, goal) => sum + goal.monthlyTarget, 0),
      averageProgress: savingsGoals.length > 0 ? 
        savingsGoals.reduce((sum, goal) => sum + goal.progressPercentage, 0) / savingsGoals.length : 0
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get savings goals stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch savings goals statistics'
    });
  }
});

// Get a specific savings goal
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!savingsGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Savings goal not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        savingsGoal
      }
    });
  } catch (error) {
    console.error('Get savings goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch savings goal'
    });
  }
});

// Create a new savings goal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      targetAmount,
      deadline,
      category
    } = req.body;

    // Validation
    if (!title || !targetAmount || !deadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, target amount, and deadline are required'
      });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Target amount must be greater than 0'
      });
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Deadline must be in the future'
      });
    }

    const savingsGoal = new SavingsGoal({
      userId: req.user.id,
      title,
      description,
      targetAmount,
      deadline: deadlineDate,
      category: category || 'other'
    });

    await savingsGoal.save();

    res.status(201).json({
      status: 'success',
      data: {
        savingsGoal
      }
    });
  } catch (error) {
    console.error('Create savings goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create savings goal'
    });
  }
});

// Update a savings goal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      targetAmount,
      deadline,
      category,
      status
    } = req.body;

    const savingsGoal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!savingsGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Savings goal not found'
      });
    }

    // Update fields if provided
    if (title) savingsGoal.title = title;
    if (description !== undefined) savingsGoal.description = description;
    if (targetAmount) {
      if (targetAmount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Target amount must be greater than 0'
        });
      }
      savingsGoal.targetAmount = targetAmount;
    }
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date()) {
        return res.status(400).json({
          status: 'error',
          message: 'Deadline must be in the future'
        });
      }
      savingsGoal.deadline = deadlineDate;
    }
    if (category) savingsGoal.category = category;
    if (status) savingsGoal.status = status;

    await savingsGoal.save();

    res.status(200).json({
      status: 'success',
      data: {
        savingsGoal
      }
    });
  } catch (error) {
    console.error('Update savings goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update savings goal'
    });
  }
});

// Add money to savings goal
router.post('/:id/add-savings', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than 0'
      });
    }

    const savingsGoal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!savingsGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Savings goal not found'
      });
    }

    savingsGoal.currentAmount += parseFloat(amount);

    // Check if goal is completed
    if (savingsGoal.currentAmount >= savingsGoal.targetAmount) {
      savingsGoal.status = 'completed';
    }

    await savingsGoal.save();

    res.status(200).json({
      status: 'success',
      data: {
        savingsGoal
      }
    });
  } catch (error) {
    console.error('Add savings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add savings'
    });
  }
});

// Delete a savings goal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!savingsGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Savings goal not found'
      });
    }

    // Soft delete
    savingsGoal.isActive = false;
    await savingsGoal.save();

    res.status(200).json({
      status: 'success',
      message: 'Savings goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete savings goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete savings goal'
    });
  }
});

module.exports = router;
