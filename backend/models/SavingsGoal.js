const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['emergency', 'vacation', 'house', 'car', 'education', 'retirement', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  monthlyTarget: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate monthly target based on deadline
savingsGoalSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('targetAmount') || this.isModified('deadline')) {
    const now = new Date();
    const deadline = new Date(this.deadline);
    const monthsRemaining = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30)));
    const remainingAmount = this.targetAmount - this.currentAmount;
    this.monthlyTarget = Math.max(0, remainingAmount / monthsRemaining);
  }
  next();
});

// Calculate progress percentage
savingsGoalSchema.virtual('progressPercentage').get(function() {
  return this.targetAmount > 0 ? Math.min(100, (this.currentAmount / this.targetAmount) * 100) : 0;
});

// Calculate days remaining
savingsGoalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Calculate months remaining
savingsGoalSchema.virtual('monthsRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)));
});

// Ensure virtual fields are serialized
savingsGoalSchema.set('toJSON', { virtuals: true });
savingsGoalSchema.set('toObject', { virtuals: true });

// Index for efficient queries
savingsGoalSchema.index({ userId: 1, status: 1 });
savingsGoalSchema.index({ userId: 1, deadline: 1 });

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

module.exports = SavingsGoal;
