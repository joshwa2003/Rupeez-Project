const mongoose = require('mongoose');

const groupBalanceSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  memberId: {
    type: String,
    required: true // Format: 'u_<userId>' or 'f_<friendId>'
  },
  balanceBase: {
    type: Number,
    required: true,
    default: 0 // Positive = others owe them, Negative = they owe others
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
groupBalanceSchema.index({ groupId: 1, memberId: 1 }, { unique: true });
groupBalanceSchema.index({ groupId: 1, balanceBase: 1 });
groupBalanceSchema.index({ groupId: 1, lastUpdated: -1 });

// Method to get net balance for a member
groupBalanceSchema.methods.getNetBalance = function() {
  return {
    amount: Math.abs(this.balanceBase),
    isOwed: this.balanceBase > 0,
    isOwing: this.balanceBase < 0
  };
};

module.exports = mongoose.model('GroupBalance', groupBalanceSchema);
