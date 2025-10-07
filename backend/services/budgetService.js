const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

class BudgetService {
  // Create a new budget
  async createBudget(userId, budgetData) {
    try {
      // Check if budget already exists for this category
      const existingBudget = await Budget.findOne({
        userId,
        category: budgetData.category,
        isActive: true
      });

      if (existingBudget) {
        throw new Error('Budget already exists for this category');
      }

      const budget = new Budget({
        userId,
        ...budgetData
      });

      await budget.save();
      return budget;
    } catch (error) {
      throw error;
    }
  }

  // Get all budgets for a user
  async getBudgets(userId) {
    try {
      const budgets = await Budget.find({ userId, isActive: true })
        .sort({ createdAt: -1 });

      // Update spent amounts and check for alerts
      for (const budget of budgets) {
        await this.updateSpentAmount(budget);
        budget.resetIfNeeded();
        await budget.save();
      }

      return budgets;
    } catch (error) {
      throw error;
    }
  }

  // Get budget by ID
  async getBudgetById(budgetId, userId) {
    try {
      const budget = await Budget.findOne({ _id: budgetId, userId, isActive: true });
      if (!budget) {
        throw new Error('Budget not found');
      }

      await this.updateSpentAmount(budget);
      budget.resetIfNeeded();
      await budget.save();

      return budget;
    } catch (error) {
      throw error;
    }
  }

  // Update budget
  async updateBudget(budgetId, userId, updateData) {
    try {
      const budget = await Budget.findOne({ _id: budgetId, userId, isActive: true });
      if (!budget) {
        throw new Error('Budget not found');
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          budget[key] = updateData[key];
        }
      });

      await budget.save();
      return budget;
    } catch (error) {
      throw error;
    }
  }

  // Delete budget (soft delete)
  async deleteBudget(budgetId, userId) {
    try {
      const budget = await Budget.findOne({ _id: budgetId, userId, isActive: true });
      if (!budget) {
        throw new Error('Budget not found');
      }

      budget.isActive = false;
      await budget.save();
      return budget;
    } catch (error) {
      throw error;
    }
  }

  // Update spent amount for a budget based on transactions
  async updateSpentAmount(budget) {
    try {
      const now = new Date();
      let startDate;

      if (budget.period === 'weekly') {
        // Start of current week (Monday)
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
      } else {
        // Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Calculate total spent in this period for the category
      const transactions = await Transaction.find({
        userId: budget.userId,
        category: budget.category,
        type: 'expense',
        date: { $gte: startDate }
      });

      const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      budget.spentAmount = totalSpent;

      return budget;
    } catch (error) {
      throw error;
    }
  }

  // Check all budgets for alerts
  async checkBudgetAlerts(userId) {
    try {
      const budgets = await this.getBudgets(userId);
      const alerts = [];

      for (const budget of budgets) {
        const alertStatus = budget.shouldTriggerAlert();
        if (alertStatus.warning || alertStatus.exceeded) {
          alerts.push({
            budgetId: budget._id,
            category: budget.category,
            limitAmount: budget.limitAmount,
            spentAmount: budget.spentAmount,
            percentageUsed: budget.percentageUsed,
            alertType: alertStatus.exceeded ? 'exceeded' : 'warning',
            period: budget.period
          });
        }
      }

      return alerts;
    } catch (error) {
      throw error;
    }
  }

  // Get budget summary for dashboard
  async getBudgetSummary(userId) {
    try {
      const budgets = await this.getBudgets(userId);
      const alerts = await this.checkBudgetAlerts(userId);

      return {
        totalBudgets: budgets.length,
        activeBudgets: budgets.filter(b => b.isActive).length,
        totalLimit: budgets.reduce((sum, b) => sum + b.limitAmount, 0),
        totalSpent: budgets.reduce((sum, b) => sum + b.spentAmount, 0),
        alerts: alerts,
        budgets: budgets.map(b => ({
          id: b._id,
          category: b.category,
          limitAmount: b.limitAmount,
          spentAmount: b.spentAmount,
          remainingAmount: b.remainingAmount,
          percentageUsed: b.percentageUsed,
          period: b.period,
          alertStatus: b.shouldTriggerAlert()
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  // Reset all budgets (for testing or manual reset)
  async resetAllBudgets(userId) {
    try {
      const budgets = await Budget.find({ userId, isActive: true });
      const now = new Date();

      for (const budget of budgets) {
        budget.spentAmount = 0;
        budget.lastResetDate = now;
        await budget.save();
      }

      return budgets;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BudgetService();
