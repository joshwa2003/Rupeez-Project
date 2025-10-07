const express = require('express');
const router = express.Router();
const budgetService = require('../services/budgetService');
const { authenticateToken } = require('../middleware/auth');

// All budget routes require authentication
router.use(authenticateToken);

// Create a new budget
router.post('/', async (req, res) => {
  try {
    const { category, limitAmount, period, alertThresholds } = req.body;
    const userId = req.user.id;

    if (!category || !limitAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Category and limit amount are required'
      });
    }

    const budget = await budgetService.createBudget(userId, {
      category,
      limitAmount: parseFloat(limitAmount),
      period: period || 'monthly',
      alertThresholds: alertThresholds || { warning: 80, exceeded: 100 }
    });

    res.status(201).json({
      status: 'success',
      message: 'Budget created successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to create budget'
    });
  }
});

// Get all budgets for the user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await budgetService.getBudgets(userId);

    res.json({
      status: 'success',
      data: { budgets }
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budgets'
    });
  }
});

// Get budget alerts - MUST be before /:id route
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user.id;
    const alerts = await budgetService.checkBudgetAlerts(userId);

    res.json({
      status: 'success',
      data: { alerts }
    });
  } catch (error) {
    console.error('Get budget alerts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budget alerts'
    });
  }
});

// Get budget summary for dashboard - MUST be before /:id route
router.get('/summary/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await budgetService.getBudgetSummary(userId);

    res.json({
      status: 'success',
      data: { summary }
    });
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budget summary'
    });
  }
});

// Get budget by ID - MUST be after specific routes
router.get('/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    const userId = req.user.id;

    const budget = await budgetService.getBudgetById(budgetId, userId);

    res.json({
      status: 'success',
      data: { budget }
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(error.message === 'Budget not found' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Failed to fetch budget'
    });
  }
});

// Update budget
router.put('/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    const userId = req.user.id;
    const { category, limitAmount, period, alertThresholds, isActive } = req.body;

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (limitAmount !== undefined) updateData.limitAmount = parseFloat(limitAmount);
    if (period !== undefined) updateData.period = period;
    if (alertThresholds !== undefined) updateData.alertThresholds = alertThresholds;
    if (isActive !== undefined) updateData.isActive = isActive;

    const budget = await budgetService.updateBudget(budgetId, userId, updateData);

    res.json({
      status: 'success',
      message: 'Budget updated successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(error.message === 'Budget not found' ? 404 : 400).json({
      status: 'error',
      message: error.message || 'Failed to update budget'
    });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    const userId = req.user.id;

    await budgetService.deleteBudget(budgetId, userId);

    res.json({
      status: 'success',
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(error.message === 'Budget not found' ? 404 : 500).json({
      status: 'error',
      message: error.message || 'Failed to delete budget'
    });
  }
});

// Reset all budgets (for testing or manual reset)
router.post('/reset/all', async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await budgetService.resetAllBudgets(userId);

    res.json({
      status: 'success',
      message: 'All budgets reset successfully',
      data: { budgets }
    });
  } catch (error) {
    console.error('Reset budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset budgets'
    });
  }
});

module.exports = router;
