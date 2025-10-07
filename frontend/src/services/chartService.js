// Chart data processing service for ApexCharts
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

export const chartService = {
  // Process spending data for pie charts
  processSpendingByCategory: (transactions, type = 'expense') => {
    const filtered = transactions.filter(t => t.type === type);
    const categoryTotals = {};
    
    filtered.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    return { labels, data };
  },

  // Process spending data for bar charts
  processSpendingByTime: (transactions, period = 'daily', type = 'expense') => {
    const filtered = transactions.filter(t => t.type === type);
    const timeTotals = {};
    
    filtered.forEach(transaction => {
      const date = parseISO(transaction.date);
      let key;
      
      switch (period) {
        case 'daily':
          key = format(date, 'MMM dd');
          break;
        case 'weekly':
          key = format(startOfWeek(date), 'MMM dd');
          break;
        case 'monthly':
          key = format(date, 'MMM yyyy');
          break;
        default:
          key = format(date, 'MMM dd');
      }
      
      timeTotals[key] = (timeTotals[key] || 0) + transaction.amount;
    });

    const categories = Object.keys(timeTotals).sort();
    const data = categories.map(cat => timeTotals[cat]);
    
    return { categories, data };
  },

  // Process income vs expense comparison
  processIncomeVsExpense: (transactions, period = 'monthly') => {
    const incomeData = {};
    const expenseData = {};
    
    transactions.forEach(transaction => {
      const date = parseISO(transaction.date);
      let key;
      
      switch (period) {
        case 'daily':
          key = format(date, 'MMM dd');
          break;
        case 'weekly':
          key = format(startOfWeek(date), 'MMM dd');
          break;
        case 'monthly':
          key = format(date, 'MMM yyyy');
          break;
        default:
          key = format(date, 'MMM yyyy');
      }
      
      if (transaction.type === 'income') {
        incomeData[key] = (incomeData[key] || 0) + transaction.amount;
      } else {
        expenseData[key] = (expenseData[key] || 0) + transaction.amount;
      }
    });

    const allKeys = [...new Set([...Object.keys(incomeData), ...Object.keys(expenseData)])].sort();
    
    const incomeSeries = allKeys.map(key => incomeData[key] || 0);
    const expenseSeries = allKeys.map(key => expenseData[key] || 0);
    
    return {
      categories: allKeys,
      series: [
        { name: 'Income', data: incomeSeries },
        { name: 'Expenses', data: expenseSeries }
      ]
    };
  },

  // Process trend analysis
  processTrendAnalysis: (transactions, type = 'expense', days = 30) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    const filtered = transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      return t.type === type && transactionDate >= startDate && transactionDate <= endDate;
    });

    const dailyTotals = {};
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, i);
      const key = format(date, 'yyyy-MM-dd');
      dailyTotals[key] = 0;
    }
    
    // Add actual transaction amounts
    filtered.forEach(transaction => {
      const date = parseISO(transaction.date);
      const key = format(date, 'yyyy-MM-dd');
      if (dailyTotals.hasOwnProperty(key)) {
        dailyTotals[key] += transaction.amount;
      }
    });

    const categories = Object.keys(dailyTotals).sort();
    const data = categories.map(cat => dailyTotals[cat]);
    
    return { categories, data };
  },

  // Process budget vs actual spending
  processBudgetAnalysis: (transactions, budgets) => {
    const budgetData = [];
    const actualData = [];
    const categories = [];
    
    budgets.forEach(budget => {
      const actualSpending = transactions
        .filter(t => t.category === budget.category && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      categories.push(budget.category);
      budgetData.push(budget.amount);
      actualData.push(actualSpending);
    });
    
    return {
      categories,
      series: [
        { name: 'Budget', data: budgetData },
        { name: 'Actual', data: actualData }
      ]
    };
  },

  // Process group expense data
  processGroupExpenses: (groupExpenses, groupMembers) => {
    const memberTotals = {};
    
    // Initialize all members with 0
    groupMembers.forEach(member => {
      memberTotals[member.displayName] = 0;
    });
    
    // Calculate total spending per member
    groupExpenses.forEach(expense => {
      const paidBy = groupMembers.find(m => 
        (m.userId && m.userId.toString() === expense.paidBy.toString()) ||
        (m.friendId && m.friendId.toString() === expense.paidBy.toString())
      );
      
      if (paidBy) {
        memberTotals[paidBy.displayName] += expense.amount;
      }
    });

    const labels = Object.keys(memberTotals);
    const data = Object.values(memberTotals);
    
    return { labels, data };
  },

  // Process savings goal progress
  processSavingsProgress: (savingsGoals) => {
    const goalData = [];
    const progressData = [];
    const categories = [];
    
    savingsGoals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      categories.push(goal.name);
      goalData.push(goal.targetAmount);
      progressData.push(goal.currentAmount);
    });
    
    return {
      categories,
      series: [
        { name: 'Target', data: goalData },
        { name: 'Current', data: progressData }
      ]
    };
  },

  // Generate chart colors based on data 
  generateColors: (dataLength, baseColors = null) => { const defaultColors = [ '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#3F51B5', '#03A9F4', '#4CAF50', '#F9CE1D', '#FF9800', '#9C27B0', '#E91E63', '#607D8B', '#795548', '#FFC107' ]; 
    if (baseColors) { return baseColors; } const colors = [];
     for (let i = 0; i < dataLength; i++) { colors.push(defaultColors[i % defaultColors.length]);
      
      } 
  return colors;
 },
  // Format currency for display
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Get date range for filtering
  getDateRange: (period) => {
    const now = new Date();
    
    switch (period) {
      case '7d':
        return {
          start: startOfDay(subDays(now, 7)),
          end: endOfDay(now)
        };
      case '30d':
        return {
          start: startOfDay(subDays(now, 30)),
          end: endOfDay(now)
        };
      case '90d':
        return {
          start: startOfDay(subDays(now, 90)),
          end: endOfDay(now)
        };
      case '1y':
        return {
          start: startOfDay(subMonths(now, 12)),
          end: endOfDay(now)
        };
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      default:
        return {
          start: startOfDay(subDays(now, 30)),
          end: endOfDay(now)
        };
    }
  }
};

export default chartService;
