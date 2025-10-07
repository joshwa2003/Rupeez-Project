const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true
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
  date: {
    type: Date,
    default: Date.now
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
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
  attachment: {
    type: String, // File path or URL
    default: null
  },
  recurringTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecurringTransaction',
    default: null,
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for better query performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return this.type === 'expense' ? -Math.abs(this.amount) : Math.abs(this.amount);
});

// Ensure virtual fields are serialized
transactionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
