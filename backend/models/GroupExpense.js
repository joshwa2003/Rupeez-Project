const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true // Format: 'u_<userId>' or 'f_<friendId>'
  },
  shareAmount: {
    type: Number,
    required: true
  },
  sharePercentage: {
    type: Number,
    default: null
  },
  shares: {
    type: Number,
    default: null
  }
}, { _id: false });

const groupExpenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  paidBy: {
    type: String,
    required: true // Format: 'u_<userId>' or 'f_<friendId>'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  convertedAmountBase: {
    type: Number,
    required: true // Amount in group's default currency
  },
  fxRate: {
    type: Number,
    required: true // Exchange rate used for conversion
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  attachments: [{
    type: String // File URLs
  }],
  splitType: {
    type: String,
    enum: ['equal', 'percentage', 'shares', 'custom'],
    required: true
  },
  split: [splitSchema],
  participants: [{
    type: String // Array of memberIds who participated
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
groupExpenseSchema.index({ groupId: 1, date: -1 });
groupExpenseSchema.index({ groupId: 1, paidBy: 1 });
groupExpenseSchema.index({ groupId: 1, category: 1 });
groupExpenseSchema.index({ groupId: 1, isActive: 1 });

// Method to validate split amounts
groupExpenseSchema.methods.validateSplit = function() {
  const totalSplit = this.split.reduce((sum, s) => sum + s.shareAmount, 0);
  const tolerance = 0.01; // Allow small rounding differences
  return Math.abs(totalSplit - this.convertedAmountBase) <= tolerance;
};

// Method to get split for a member
groupExpenseSchema.methods.getMemberSplit = function(memberId) {
  return this.split.find(s => s.memberId === memberId);
};

module.exports = mongoose.model('GroupExpense', groupExpenseSchema);
