const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const groupService = require('../services/groupService');
const Group = require('../models/Group');
const Friend = require('../models/Friend');
const GroupExpense = require('../models/GroupExpense');
const GroupSettlement = require('../models/GroupSettlement');

// @route   GET /api/groups
// @desc    Get all groups for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { userId: req.user.id },
        { 'members.userId': req.user.id }
      ],
      isActive: true
    }).sort({ updatedAt: -1 });

    res.json({
      status: 'success',
      data: { groups }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching groups'
    });
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is owner or member
    if (group.userId.toString() !== req.user.id && !group.isMember(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.json({
      status: 'success',
      data: { group }
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching group'
    });
  }
});

// @route   POST /api/groups
// @desc    Create new group
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, members, defaultCurrency } = req.body;

    // Basic validation
    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name and members'
      });
    }

    // Add owner as first member if not already included
    const ownerMember = {
      userId: req.user.id,
      displayName: req.user.name || req.user.email,
      email: req.user.email
    };

    const allMembers = [ownerMember, ...members];

    const groupData = {
      userId: req.user.id,
      name,
      description: description || '',
      members: allMembers,
      defaultCurrency: defaultCurrency || 'INR'
    };

    const group = await groupService.createGroup(groupData);

    res.status(201).json({
      status: 'success',
      data: { group }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating group'
    });
  }
});

// @route   POST /api/groups/:id/friends
// @desc    Add friend to group
// @access  Private
router.post('/:id/friends', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is owner
    if (group.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Only group owner can add friends'
      });
    }

    // Create friend
    const friend = new Friend({
      userId: req.user.id,
      name,
      email,
      phone
    });

    const savedFriend = await friend.save();

    // Add friend to group
    const newMember = {
      friendId: savedFriend._id,
      displayName: name,
      email: email || null
    };

    group.members.push(newMember);
    await group.save();

    // Initialize balance for new member
    await groupService.initializeGroupBalances(groupId, [newMember], group.defaultCurrency);

    res.status(201).json({
      status: 'success',
      data: { friend: savedFriend, group }
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding friend'
    });
  }
});

// @route   POST /api/groups/:id/expenses
// @desc    Add expense to group
// @access  Private
router.post('/:id/expenses', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { paidBy, amount, currency, category, date, notes, splitType, split, participants } = req.body;

    // Basic validation
    if (!paidBy || !amount || !category || !splitType || !split) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const expenseData = {
      groupId,
      paidBy,
      amount: parseFloat(amount),
      currency: currency || group.defaultCurrency,
      category,
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      splitType,
      split,
      participants: participants || split.map(s => s.memberId)
    };

    const expense = await groupService.addGroupExpense(expenseData);

    res.status(201).json({
      status: 'success',
      data: { expense }
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding expense'
    });
  }
});

// @route   GET /api/groups/:id/expenses
// @desc    Get group expenses
// @access  Private
router.get('/:id/expenses', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const filters = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const expenses = await groupService.getGroupExpenses(groupId, filters);

    res.json({
      status: 'success',
      data: { expenses }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching expenses'
    });
  }
});

// @route   GET /api/groups/:id/balances
// @desc    Get group balances
// @access  Private
router.get('/:id/balances', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const balances = await groupService.getGroupBalances(groupId);

    res.json({
      status: 'success',
      data: { balances }
    });
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching balances'
    });
  }
});

// @route   GET /api/groups/:id/settle-suggestions
// @desc    Get settlement suggestions
// @access  Private
router.get('/:id/settle-suggestions', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const suggestions = await groupService.generateSettlementSuggestions(groupId);

    res.json({
      status: 'success',
      data: { suggestions }
    });
  } catch (error) {
    console.error('Get settlement suggestions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while generating settlement suggestions'
    });
  }
});

// @route   POST /api/groups/:id/settlements
// @desc    Create settlement
// @access  Private
router.post('/:id/settlements', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { fromMemberId, toMemberId, amount, currency, notes } = req.body;

    // Basic validation
    if (!fromMemberId || !toMemberId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const settlementData = {
      groupId,
      fromMemberId,
      toMemberId,
      amount: parseFloat(amount),
      currency: currency || group.defaultCurrency,
      notes: notes || ''
    };

    const settlement = await groupService.createSettlement(settlementData);

    res.status(201).json({
      status: 'success',
      data: { settlement }
    });
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating settlement'
    });
  }
});

// @route   POST /api/groups/:id/settlements/:settlementId/complete
// @desc    Complete settlement
// @access  Private
router.post('/:id/settlements/:settlementId/complete', authenticateToken, async (req, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = await GroupSettlement.findById(settlementId);
    if (!settlement) {
      return res.status(404).json({
        status: 'error',
        message: 'Settlement not found'
      });
    }

    const group = await Group.findById(settlement.groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const completedSettlement = await groupService.completeSettlement(settlementId);

    res.json({
      status: 'success',
      data: { settlement: completedSettlement }
    });
  } catch (error) {
    console.error('Complete settlement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while completing settlement'
    });
  }
});

// @route   GET /api/groups/:id/settlements
// @desc    Get group settlements
// @access  Private
router.get('/:id/settlements', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const settlements = await GroupSettlement.find({ groupId })
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { settlements }
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching settlements'
    });
  }
});

module.exports = router;
