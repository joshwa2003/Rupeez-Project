const SavingsGoal = require('../models/SavingsGoal');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class SavingsGoalService {
  // Generate AI-based suggestions for a savings goal
  async generateSuggestions(userId, goalId) {
    try {
      const goal = await SavingsGoal.findOne({ _id: goalId, userId });
      if (!goal) {
        throw new Error('Savings goal not found');
      }

      const suggestions = [];

      // Check if user is falling behind
      const progress = goal.progressPercentage;
      const daysRemaining = goal.daysRemaining;

      if (progress < 50 && daysRemaining < 30) {
        // Calculate required weekly savings to catch up
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
        const weeklySavings = remainingAmount / weeksRemaining;

        suggestions.push({
          type: 'catch_up',
          message: `To meet your goal by ${goal.deadline.toDateString()}, increase your weekly savings by ₹${weeklySavings.toFixed(2)}.`,
          action: 'increase_savings',
          value: weeklySavings
        });
      }

      // Analyze spending patterns
      const spendingInsights = await this.analyzeSpendingPatterns(userId);
      suggestions.push(...spendingInsights);

      // Motivation based on progress
      if (progress >= 75) {
        suggestions.push({
          type: 'motivation',
          message: `You're only ₹${(goal.targetAmount - goal.currentAmount).toFixed(2)} away from your goal! Keep it up!`,
          action: 'motivate'
        });
      } else if (progress >= 50) {
        suggestions.push({
          type: 'motivation',
          message: `You're halfway there! ₹${(goal.targetAmount - goal.currentAmount).toFixed(2)} to go.`,
          action: 'motivate'
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  // Analyze user's spending patterns to provide insights
  async analyzeSpendingPatterns(userId) {
    try {
      const insights = [];

      // Get transactions from last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const transactions = await Transaction.find({
        userId,
        type: 'expense',
        date: { $gte: threeMonthsAgo }
      }).sort({ date: -1 });

      if (transactions.length === 0) {
        return insights;
      }

      // Group by category
      const categorySpending = {};
      transactions.forEach(transaction => {
        if (!categorySpending[transaction.category]) {
          categorySpending[transaction.category] = 0;
        }
        categorySpending[transaction.category] += transaction.amount;
      });

      // Find top spending categories
      const topCategories = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

      if (topCategories.length > 0) {
        const [topCategory, amount] = topCategories[0];
        insights.push({
          type: 'spending_insight',
          message: `Your highest spending is in ${topCategory} (₹${amount.toFixed(2)} in 3 months). Consider reducing expenses here to boost savings.`,
          action: 'reduce_spending',
          category: topCategory,
          amount: amount
        });
      }

      // Calculate average monthly spending
      const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
      const avgMonthlySpending = totalSpending / 3;

      insights.push({
        type: 'general_insight',
        message: `Your average monthly spending is ₹${avgMonthlySpending.toFixed(2)}. Setting aside 20% could save ₹${(avgMonthlySpending * 0.2).toFixed(2)} monthly.`,
        action: 'budget_tip',
        value: avgMonthlySpending * 0.2
      });

      return insights;
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
      return [];
    }
  }

  // Get goal progress data for charts
  async getGoalProgressData(userId, goalId) {
    try {
      const goal = await SavingsGoal.findOne({ _id: goalId, userId });
      if (!goal) {
        throw new Error('Savings goal not found');
      }

      const now = new Date();
      const deadline = new Date(goal.deadline);
      const totalDays = Math.ceil((deadline - goal.createdAt) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((now - goal.createdAt) / (1000 * 60 * 60 * 24));

      // Generate projection data
      const projectionData = [];
      const monthsRemaining = goal.monthsRemaining;

      for (let i = 0; i <= monthsRemaining; i++) {
        const projectedAmount = Math.min(
          goal.targetAmount,
          goal.currentAmount + (goal.monthlyTarget * i)
        );
        const projectedProgress = (projectedAmount / goal.targetAmount) * 100;

        projectionData.push({
          month: i,
          projectedAmount: projectedAmount,
          projectedProgress: projectedProgress,
          targetAmount: goal.targetAmount
        });
      }

      return {
        currentProgress: goal.progressPercentage,
        daysRemaining: goal.daysRemaining,
        monthlyTarget: goal.monthlyTarget,
        projectionData
      };
    } catch (error) {
      console.error('Error getting goal progress data:', error);
      return null;
    }
  }
}

module.exports = new SavingsGoalService();
