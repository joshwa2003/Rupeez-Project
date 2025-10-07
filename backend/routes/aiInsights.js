const express = require('express');
const router = express.Router();
const aiInsightsService = require('../services/aiInsightsService');
const transactionService = require('../services/transactionService');
const budgetService = require('../services/budgetService');
const { authenticateToken } = require('../middleware/auth');

// All AI routes require authentication
router.use(authenticateToken);

// Generate spending insights
router.get('/spending-insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '90d' } = req.query;
    
    // Get user's transactions
    const transactions = await transactionService.getUserTransactions(userId, timeframe);
    
    if (!transactions || transactions.length === 0) {
      return res.json({
        status: 'success',
        data: {
          insights: [],
          summary: { message: 'No transactions found. Start adding transactions to get AI insights!' },
          recommendations: ['Add your first transaction to begin tracking expenses', 'Set up recurring transactions for predictable expenses']
        }
      });
    }
    
    // Generate AI insights
    const insightsData = await aiInsightsService.generateSpendingInsights(transactions);
    
    res.json({
      status: 'success',
      data: insightsData
    });
  } catch (error) {
    console.error('Generate spending insights error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate spending insights'
    });
  }
});

// Generate budget recommendations
router.get('/budget-recommendations', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's transactions and current budgets
    const [transactions, currentBudgets] = await Promise.all([
      transactionService.getUserTransactions(userId, '180d'), // 6 months of data
      budgetService.getBudgets(userId)
    ]);
    
    if (!transactions || transactions.length === 0) {
      return res.json({
        status: 'success',
        data: {
          recommendations: [
            {
              type: 'getting_started',
              message: 'Start by adding some transactions to get personalized budget recommendations',
              confidence: 'high'
            }
          ],
          totalRecommendedBudget: 0,
          savingsPotential: 0
        }
      });
    }
    
    // Generate AI budget recommendations
    const recommendationsData = await aiInsightsService.generateBudgetRecommendations(transactions, currentBudgets);
    
    res.json({
      status: 'success',
      data: recommendationsData
    });
  } catch (error) {
    console.error('Generate budget recommendations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate budget recommendations'
    });
  }
});

// Get AI-powered spending analysis for a specific category
router.get('/category-analysis/:category', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const { timeframe = '90d' } = req.query;
    
    // Get transactions for the specific category
    const transactions = await transactionService.getUserTransactions(userId, timeframe);
    const categoryTransactions = transactions.filter(t => 
      t.category.toLowerCase() === category.toLowerCase() && t.type === 'expense'
    );
    
    if (categoryTransactions.length === 0) {
      return res.json({
        status: 'success',
        data: {
          analysis: `No transactions found for ${category} category`,
          recommendations: [`Start tracking ${category} expenses to get detailed analysis`]
        }
      });
    }
    
    // Analyze category spending
    const totalSpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTransaction = totalSpent / categoryTransactions.length;
    const frequency = categoryTransactions.length;
    
    // Generate insights
    const analysis = {
      totalSpent,
      avgTransaction,
      frequency,
      insights: [
        `You've spent ₹${totalSpent.toFixed(0)} on ${category} in the last ${timeframe}`,
        `Average transaction amount: ₹${avgTransaction.toFixed(0)}`,
        `Transaction frequency: ${frequency} transactions`
      ],
      recommendations: []
    };
    
    // Add smart recommendations based on patterns
    if (avgTransaction > 1000) {
      analysis.recommendations.push(`Your average ${category} transaction is quite high. Consider looking for cost-effective alternatives.`);
    }
    
    if (frequency > 20) {
      analysis.recommendations.push(`You have frequent ${category} transactions. Consider setting up a dedicated budget to track this category better.`);
    }
    
    res.json({
      status: 'success',
      data: analysis
    });
  } catch (error) {
    console.error('Category analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate category analysis'
    });
  }
});

// Get personalized financial tips
router.get('/financial-tips', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent transactions and budgets
    const [transactions, budgets] = await Promise.all([
      transactionService.getUserTransactions(userId, '30d'),
      budgetService.getBudgets(userId)
    ]);
    
    const tips = [];
    
    // Generate tips based on user data
    if (transactions.length === 0) {
      tips.push({
        category: 'getting_started',
        tip: 'Start by adding your daily expenses to get personalized financial insights',
        priority: 'high'
      });
    } else {
      // Analyze spending patterns for tips
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      
      if (budgets.length === 0) {
        tips.push({
          category: 'budgeting',
          tip: 'Set up budgets for your main expense categories to better control spending',
          priority: 'high'
        });
      }
      
      if (totalIncome > 0) {
        const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
        if (savingsRate < 20) {
          tips.push({
            category: 'savings',
            tip: 'Try to save at least 20% of your income for financial security',
            priority: 'medium'
          });
        }
      }
      
      // Category-specific tips
      const categoryTotals = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });
      
      const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
      if (topCategory) {
        tips.push({
          category: 'optimization',
          tip: `${topCategory[0]} is your biggest expense. Look for ways to optimize costs in this category`,
          priority: 'medium'
        });
      }
    }
    
    // Add general financial tips
    tips.push({
      category: 'general',
      tip: 'Review your subscriptions monthly and cancel unused services',
      priority: 'low'
    });
    
    tips.push({
      category: 'general',
      tip: 'Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings',
      priority: 'low'
    });
    
    res.json({
      status: 'success',
      data: { tips: tips.slice(0, 5) }
    });
  } catch (error) {
    console.error('Financial tips error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate financial tips'
    });
  }
});

module.exports = router;
