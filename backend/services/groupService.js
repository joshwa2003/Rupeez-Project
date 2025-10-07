const Group = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const GroupBalance = require('../models/GroupBalance');
const GroupSettlement = require('../models/GroupSettlement');
const Friend = require('../models/Friend');
const { getExchangeRates } = require('./currencyService');

/**
 * Create a new group
 * @param {Object} groupData - Group data
 * @param {string} groupData.userId - Owner user ID
 * @param {string} groupData.name - Group name
 * @param {string} groupData.description - Group description
 * @param {Array} groupData.members - Array of member objects
 * @param {string} groupData.defaultCurrency - Default currency
 * @returns {Promise<Object>} Created group
 */
const createGroup = async (groupData) => {
  try {
    const group = new Group(groupData);
    const savedGroup = await group.save();
    
    // Initialize balances for all members
    await initializeGroupBalances(savedGroup._id, savedGroup.members, groupData.defaultCurrency);
    
    return savedGroup;
  } catch (error) {
    console.error('Error creating group:', error);
    throw new Error('Failed to create group');
  }
};

/**
 * Initialize group balances for all members
 * @param {string} groupId - Group ID
 * @param {Array} members - Array of members
 * @param {string} currency - Currency
 */
const initializeGroupBalances = async (groupId, members, currency) => {
  try {
    const balancePromises = members.map(member => {
      const memberId = member.userId ? `u_${member.userId}` : `f_${member.friendId}`;
      return GroupBalance.findOneAndUpdate(
        { groupId, memberId },
        { 
          groupId, 
          memberId, 
          balanceBase: 0, 
          currency,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    });
    
    await Promise.all(balancePromises);
  } catch (error) {
    console.error('Error initializing group balances:', error);
    throw new Error('Failed to initialize group balances');
  }
};

/**
 * Add expense to group
 * @param {Object} expenseData - Expense data
 * @returns {Promise<Object>} Created expense
 */
const addGroupExpense = async (expenseData) => {
  try {
    const group = await Group.findById(expenseData.groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Convert amount to group's base currency
    const exchangeRates = await getExchangeRates(group.defaultCurrency);
    const fxRate = exchangeRates.rates[expenseData.currency] || 1;
    const convertedAmountBase = expenseData.amount * fxRate;

    const expense = new GroupExpense({
      ...expenseData,
      convertedAmountBase,
      fxRate
    });

    const savedExpense = await expense.save();
    
    // Update group balances
    await updateGroupBalances(expenseData.groupId, savedExpense);
    
    return savedExpense;
  } catch (error) {
    console.error('Error adding group expense:', error);
    throw new Error('Failed to add group expense');
  }
};

/**
 * Update group balances after expense
 * @param {string} groupId - Group ID
 * @param {Object} expense - Expense object
 */
const updateGroupBalances = async (groupId, expense) => {
  try {
    const balanceUpdates = [];

    // Update balances for all participants
    for (const split of expense.split) {
      const memberId = split.memberId;
      
      // Subtract share amount from member's balance (they owe this amount)
      balanceUpdates.push(
        GroupBalance.findOneAndUpdate(
          { groupId, memberId },
          { $inc: { balanceBase: -split.shareAmount } },
          { upsert: true, new: true }
        )
      );
    }

    // Add total amount to payer's balance (others owe them this amount)
    balanceUpdates.push(
      GroupBalance.findOneAndUpdate(
        { groupId, memberId: expense.paidBy },
        { $inc: { balanceBase: expense.convertedAmountBase } },
        { upsert: true, new: true }
      )
    );

    await Promise.all(balanceUpdates);
  } catch (error) {
    console.error('Error updating group balances:', error);
    throw new Error('Failed to update group balances');
  }
};

/**
 * Get group balances
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} Array of balances
 */
const getGroupBalances = async (groupId) => {
  try {
    const balances = await GroupBalance.find({ groupId });
    return balances;
  } catch (error) {
    console.error('Error getting group balances:', error);
    throw new Error('Failed to get group balances');
  }
};

/**
 * Generate settlement suggestions (debt simplification)
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} Array of settlement suggestions
 */
const generateSettlementSuggestions = async (groupId) => {
  try {
    const balances = await getGroupBalances(groupId);
    const suggestions = [];

    // Separate creditors and debtors
    const creditors = balances.filter(b => b.balanceBase > 0.01);
    const debtors = balances.filter(b => b.balanceBase < -0.01);

    // Sort by balance amount
    creditors.sort((a, b) => b.balanceBase - a.balanceBase);
    debtors.sort((a, b) => a.balanceBase - b.balanceBase);

    // Greedy matching algorithm
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const payment = Math.min(-debtor.balanceBase, creditor.balanceBase);
      
      if (payment > 0.01) {
        suggestions.push({
          fromMemberId: debtor.memberId,
          toMemberId: creditor.memberId,
          amount: payment,
          currency: debtor.currency
        });
      }

      debtor.balanceBase += payment;
      creditor.balanceBase -= payment;

      if (Math.abs(debtor.balanceBase) < 0.01) i++;
      if (Math.abs(creditor.balanceBase) < 0.01) j++;
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating settlement suggestions:', error);
    throw new Error('Failed to generate settlement suggestions');
  }
};

/**
 * Create settlement
 * @param {Object} settlementData - Settlement data
 * @returns {Promise<Object>} Created settlement
 */
const createSettlement = async (settlementData) => {
  try {
    const settlement = new GroupSettlement(settlementData);
    return await settlement.save();
  } catch (error) {
    console.error('Error creating settlement:', error);
    throw new Error('Failed to create settlement');
  }
};

/**
 * Complete settlement
 * @param {string} settlementId - Settlement ID
 * @returns {Promise<Object>} Updated settlement
 */
const completeSettlement = async (settlementId) => {
  try {
    const settlement = await GroupSettlement.findById(settlementId);
    if (!settlement) {
      throw new Error('Settlement not found');
    }

    // Update balances
    await GroupBalance.findOneAndUpdate(
      { groupId: settlement.groupId, memberId: settlement.fromMemberId },
      { $inc: { balanceBase: settlement.amount } }
    );

    await GroupBalance.findOneAndUpdate(
      { groupId: settlement.groupId, memberId: settlement.toMemberId },
      { $inc: { balanceBase: -settlement.amount } }
    );

    // Mark settlement as completed
    settlement.status = 'completed';
    settlement.completedAt = new Date();
    
    return await settlement.save();
  } catch (error) {
    console.error('Error completing settlement:', error);
    throw new Error('Failed to complete settlement');
  }
};

/**
 * Get group expenses with filters
 * @param {string} groupId - Group ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of expenses
 */
const getGroupExpenses = async (groupId, filters = {}) => {
  try {
    const query = { groupId, isActive: true };
    
    if (filters.member) {
      query.$or = [
        { paidBy: filters.member },
        { 'split.memberId': filters.member }
      ];
    }
    
    if (filters.category) {
      query.category = new RegExp(filters.category, 'i');
    }
    
    if (filters.from && filters.to) {
      query.date = {
        $gte: new Date(filters.from),
        $lte: new Date(filters.to)
      };
    }
    
    if (filters.search) {
      query.$or = [
        { notes: new RegExp(filters.search, 'i') },
        { category: new RegExp(filters.search, 'i') }
      ];
    }

    const expenses = await GroupExpense.find(query)
      .sort({ date: -1 })
      .limit(filters.limit || 50);
    
    return expenses;
  } catch (error) {
    console.error('Error getting group expenses:', error);
    throw new Error('Failed to get group expenses');
  }
};

module.exports = {
  createGroup,
  addGroupExpense,
  getGroupBalances,
  generateSettlementSuggestions,
  createSettlement,
  completeSettlement,
  getGroupExpenses,
  updateGroupBalances,
  initializeGroupBalances
};
