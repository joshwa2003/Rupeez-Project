const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Transaction Template
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Recurrence Settings
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  interval: {
    type: Number,
    default: 1, // Always 1 - no custom intervals
    min: 1,
    max: 1
  },
  dayOfMonth: {
    type: Number, // 1-31 or -1 for last day
    min: -1,
    max: 31,
    default: null
  },
  dayOfWeek: {
    type: Number, // 0-6 (Sunday-Saturday)
    min: 0,
    max: 6,
    default: null
  },
  
  // Schedule Management
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null // null means no end date
  },
  nextOccurrence: {
    type: Date,
    required: true,
    index: true
  },
  lastProcessed: {
    type: Date,
    default: null
  },
  
  // Status and Control
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  autoApprove: {
    type: Boolean,
    default: true // Auto-create transactions or require approval
  },
  
  // Notifications
  notifyUser: {
    type: Boolean,
    default: true
  },
  notificationMethod: {
    type: String,
    enum: ['email', 'in-app', 'both'],
    default: 'in-app'
  },
  
  // Tracking
  totalOccurrences: {
    type: Number,
    default: 0 // Count of transactions created
  },
  skippedDates: [{
    type: Date
  }]
  
}, {
  timestamps: true
});

// Compound indexes for efficient queries
recurringTransactionSchema.index({ userId: 1, status: 1 });
recurringTransactionSchema.index({ nextOccurrence: 1, status: 1 });
recurringTransactionSchema.index({ userId: 1, nextOccurrence: 1 });

// Virtual for formatted amount
recurringTransactionSchema.virtual('formattedAmount').get(function() {
  return this.type === 'expense' ? -Math.abs(this.amount) : Math.abs(this.amount);
});

// Method to calculate next occurrence
recurringTransactionSchema.methods.calculateNextOccurrence = function() {
  const current = new Date(this.nextOccurrence);
  const next = new Date(current);

  switch (this.frequency) {
    case 'daily':
      next.setDate(next.getDate() + this.interval);
      break;

    case 'weekly':
      next.setDate(next.getDate() + (7 * this.interval));
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + this.interval);
      
      // Handle specific day of month
      if (this.dayOfMonth) {
        if (this.dayOfMonth === -1) {
          // Last day of month
          next.setMonth(next.getMonth() + 1);
          next.setDate(0);
        } else {
          // Specific day, adjust if day doesn't exist in month
          const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          next.setDate(Math.min(this.dayOfMonth, daysInMonth));
        }
      }
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + this.interval);
      break;
  }

  return next;
};

// Ensure virtual fields are serialized
recurringTransactionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);
