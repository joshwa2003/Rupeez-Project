const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  limitAmount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly'],
    default: 'monthly'
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  alertThresholds: {
    warning: {
      type: Number,
      default: 80, // 80% of limit
      min: 0,
      max: 100
    },
    exceeded: {
      type: Number,
      default: 100, // 100% of limit
      min: 0,
      max: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for better query performance
budgetSchema.index({ userId: 1, category: 1 });
budgetSchema.index({ userId: 1, isActive: 1 });

// Virtual for remaining amount
budgetSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.limitAmount - this.spentAmount);
});

// Virtual for percentage used
budgetSchema.virtual('percentageUsed').get(function() {
  return this.limitAmount > 0 ? (this.spentAmount / this.limitAmount) * 100 : 0;
});

// Ensure virtual fields are serialized
budgetSchema.set('toJSON', {
  virtuals: true
});

// Method to check if alert should be triggered
budgetSchema.methods.shouldTriggerAlert = function() {
  const percentage = this.percentageUsed;
  return {
    warning: percentage >= this.alertThresholds.warning,
    exceeded: percentage >= this.alertThresholds.exceeded
  };
};

// Method to reset spent amount based on period
budgetSchema.methods.resetIfNeeded = function() {
  const now = new Date();
  const lastReset = new Date(this.lastResetDate);
  let shouldReset = false;

  if (this.period === 'weekly') {
    // Reset every Monday (start of week)
    const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
    shouldReset = daysSinceReset >= 7;
  } else if (this.period === 'monthly') {
    // Reset on the 1st of each month
    shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  }

  if (shouldReset) {
    this.spentAmount = 0;
    this.lastResetDate = now;
  }

  return shouldReset;
};

module.exports = mongoose.model('Budget', budgetSchema);
