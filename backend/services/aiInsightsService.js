class AIInsightsService {
  constructor() {
    // Pure algorithmic AI - no external APIs
  }

  /**
   * Generate spending insights based on transaction data
   */
  async generateSpendingInsights(transactionData) {
    try {
      const insights = [];
      
      // Calculate basic metrics
      const currentMonth = this.getCurrentMonthData(transactionData);
      const previousMonth = this.getPreviousMonthData(transactionData);
      
      // Generate insights
      insights.push(...this.generateComparisonInsights(currentMonth, previousMonth));
      insights.push(...this.generateCategoryInsights(currentMonth));
      insights.push(...this.generateTrendInsights(transactionData));
      insights.push(...this.generateGoalInsights(currentMonth));
      
      return {
        insights: insights.slice(0, 5), // Return top 5 insights
        summary: this.generateSummary(currentMonth, previousMonth),
        recommendations: this.generateRecommendations(currentMonth, previousMonth)
      };
    } catch (error) {
      console.error('Error generating spending insights:', error);
      return this.getFallbackInsights(transactionData);
    }
  }

  /**
   * Generate budget recommendations based on spending patterns
   */
  async generateBudgetRecommendations(transactionData, currentBudgets = []) {
    try {
      const spendingPatterns = this.analyzeSpendingPatterns(transactionData);
      const recommendations = [];

      // Analyze each category
      Object.entries(spendingPatterns.categoryAverages).forEach(([category, avgSpending]) => {
        const existingBudget = currentBudgets.find(b => b.category === category);
        
        if (!existingBudget) {
          // Suggest new budget
          const suggestedAmount = Math.ceil(avgSpending * 1.1); // 10% buffer
          recommendations.push({
            type: 'new_budget',
            category,
            suggestedAmount,
            reason: `Based on your average monthly spending of ₹${avgSpending.toFixed(0)}, we recommend setting a budget with a 10% buffer.`,
            confidence: this.calculateConfidence(spendingPatterns.categoryData[category])
          });
        } else {
          // Analyze existing budget
          const utilizationRate = (avgSpending / existingBudget.limitAmount) * 100;
          
          if (utilizationRate > 90) {
            recommendations.push({
              type: 'increase_budget',
              category,
              currentAmount: existingBudget.limitAmount,
              suggestedAmount: Math.ceil(avgSpending * 1.15),
              reason: `Your current budget is ${utilizationRate.toFixed(0)}% utilized. Consider increasing it to avoid frequent overages.`,
              confidence: 'high'
            });
          } else if (utilizationRate < 60) {
            recommendations.push({
              type: 'decrease_budget',
              category,
              currentAmount: existingBudget.limitAmount,
              suggestedAmount: Math.ceil(avgSpending * 1.05),
              reason: `You're only using ${utilizationRate.toFixed(0)}% of this budget. You could reduce it and allocate funds elsewhere.`,
              confidence: 'medium'
            });
          }
        }
      });

      // Add category-specific recommendations
      recommendations.push(...this.generateCategorySpecificRecommendations(spendingPatterns));

      return {
        recommendations: recommendations.slice(0, 6),
        totalRecommendedBudget: this.calculateTotalRecommendedBudget(recommendations),
        savingsPotential: this.calculateSavingsPotential(spendingPatterns, recommendations)
      };
    } catch (error) {
      console.error('Error generating budget recommendations:', error);
      return this.getFallbackBudgetRecommendations();
    }
  }

  // Helper methods
  getCurrentMonthData(transactions) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
  }

  getPreviousMonthData(transactions) {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === prevMonth && tDate.getFullYear() === prevYear;
    });
  }

  generateComparisonInsights(current, previous) {
    const insights = [];
    
    const currentExpenses = current.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const previousExpenses = previous.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    if (previousExpenses > 0) {
      const change = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
      
      if (Math.abs(change) > 5) {
        insights.push({
          type: 'comparison',
          message: `You ${change > 0 ? 'spent' : 'saved'} ${Math.abs(change).toFixed(1)}% ${change > 0 ? 'more' : 'less'} this month compared to last month`,
          impact: Math.abs(change) > 20 ? 'high' : 'medium',
          amount: Math.abs(currentExpenses - previousExpenses)
        });
      }
    }
    
    return insights;
  }

  generateCategoryInsights(transactions) {
    const insights = [];
    const categoryTotals = {};
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    
    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
      const percentage = (topCategory[1] / totalExpenses) * 100;
      
      insights.push({
        type: 'category',
        message: `${topCategory[0]} is your biggest expense category, accounting for ${percentage.toFixed(1)}% of your spending`,
        impact: percentage > 40 ? 'high' : 'medium',
        category: topCategory[0],
        amount: topCategory[1]
      });
    }
    
    return insights;
  }

  generateTrendInsights(transactions) {
    const insights = [];
    
    // Analyze weekly spending trend
    const weeklySpending = this.getWeeklySpending(transactions);
    if (weeklySpending.length >= 2) {
      const trend = this.calculateTrend(weeklySpending);
      
      if (Math.abs(trend) > 10) {
        insights.push({
          type: 'trend',
          message: `Your weekly spending is ${trend > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(trend).toFixed(1)}% on average`,
          impact: Math.abs(trend) > 25 ? 'high' : 'medium',
          trend: trend > 0 ? 'increasing' : 'decreasing'
        });
      }
    }
    
    return insights;
  }

  generateGoalInsights(transactions) {
    const insights = [];
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      
      if (savingsRate < 10) {
        insights.push({
          type: 'goal',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%. Consider aiming for at least 20% to build financial security`,
          impact: 'high',
          currentRate: savingsRate,
          targetRate: 20
        });
      } else if (savingsRate > 30) {
        insights.push({
          type: 'goal',
          message: `Excellent! You're saving ${savingsRate.toFixed(1)}% of your income. You're on track for strong financial health`,
          impact: 'positive',
          currentRate: savingsRate
        });
      }
    }
    
    return insights;
  }

  generateSummary(current, previous) {
    const currentTotal = current.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const previousTotal = previous.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    
    return {
      currentMonthSpending: currentTotal,
      previousMonthSpending: previousTotal,
      changePercentage: change,
      trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable'
    };
  }

  generateRecommendations(current, previous) {
    const recommendations = [];
    
    // Basic recommendations based on spending patterns
    const categoryTotals = {};
    current.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    
    if (sortedCategories.length > 0) {
      recommendations.push(`Consider setting a budget for ${sortedCategories[0][0]} to better control your largest expense category`);
    }
    
    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    if (totalExpenses > 0) {
      recommendations.push('Track daily expenses to identify small recurring costs that add up over time');
      recommendations.push('Review subscription services and cancel unused ones to reduce monthly expenses');
    }
    
    return recommendations.slice(0, 3);
  }

  analyzeSpendingPatterns(transactions) {
    const categoryData = {};
    const monthlyData = {};
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const category = t.category || 'Uncategorized';
      const monthKey = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
      
      if (!categoryData[category]) {
        categoryData[category] = [];
      }
      categoryData[category].push(t.amount);
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      monthlyData[monthKey][category] = (monthlyData[monthKey][category] || 0) + t.amount;
    });
    
    // Calculate averages
    const categoryAverages = {};
    Object.entries(categoryData).forEach(([category, amounts]) => {
      categoryAverages[category] = amounts.reduce((sum, amount) => sum + amount, 0) / Math.max(Object.keys(monthlyData).length, 1);
    });
    
    return { categoryData, categoryAverages, monthlyData };
  }

  generateCategorySpecificRecommendations(patterns) {
    const recommendations = [];
    
    // Food & Dining recommendations
    if (patterns.categoryAverages['Food & Dining'] > 15000) {
      recommendations.push({
        type: 'optimization',
        category: 'Food & Dining',
        message: 'Your dining expenses are quite high. Consider meal planning and cooking at home more often.',
        potentialSavings: patterns.categoryAverages['Food & Dining'] * 0.3
      });
    }
    
    // Transportation recommendations
    if (patterns.categoryAverages['Transportation'] > 8000) {
      recommendations.push({
        type: 'optimization',
        category: 'Transportation',
        message: 'Consider carpooling, public transport, or ride-sharing to reduce transportation costs.',
        potentialSavings: patterns.categoryAverages['Transportation'] * 0.2
      });
    }
    
    return recommendations;
  }

  calculateConfidence(dataPoints) {
    if (!dataPoints || dataPoints.length < 3) return 'low';
    if (dataPoints.length < 6) return 'medium';
    return 'high';
  }

  calculateTotalRecommendedBudget(recommendations) {
    return recommendations
      .filter(r => r.suggestedAmount)
      .reduce((sum, r) => sum + r.suggestedAmount, 0);
  }

  calculateSavingsPotential(patterns, recommendations) {
    return recommendations
      .filter(r => r.potentialSavings)
      .reduce((sum, r) => sum + r.potentialSavings, 0);
  }

  getWeeklySpending(transactions) {
    // Simplified weekly spending calculation
    const weeklyData = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const weekKey = this.getWeekKey(new Date(t.date));
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + t.amount;
    });
    
    return Object.values(weeklyData);
  }

  getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil(date.getDate() / 7);
    return `${year}-${date.getMonth()}-${week}`;
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  getFallbackInsights(transactions) {
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      insights: [
        {
          type: 'basic',
          message: `You've spent ₹${totalExpenses.toFixed(0)} in total across ${transactions.length} transactions`,
          impact: 'medium'
        }
      ],
      summary: {
        currentMonthSpending: totalExpenses,
        trend: 'stable'
      },
      recommendations: [
        'Set up budgets for your main expense categories',
        'Track your spending regularly to identify patterns',
        'Consider using the recurring transactions feature for predictable expenses'
      ]
    };
  }

  getFallbackBudgetRecommendations() {
    return {
      recommendations: [
        {
          type: 'general',
          message: 'Start by setting budgets for your top 3 expense categories',
          confidence: 'medium'
        }
      ],
      totalRecommendedBudget: 0,
      savingsPotential: 0
    };
  }
}

module.exports = new AIInsightsService();
