const mongoose = require('mongoose');

const groupSettlementSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  fromMemberId: {
    type: String,
    required: true // Format: 'u_<userId>' or 'f_<friendId>'
  },
  toMemberId: {
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
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  proof: {
    type: String, // File URL or transaction reference
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
groupSettlementSchema.index({ groupId: 1, status: 1 });
groupSettlementSchema.index({ groupId: 1, fromMemberId: 1 });
groupSettlementSchema.index({ groupId: 1, toMemberId: 1 });
groupSettlementSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('GroupSettlement', groupSettlementSchema);
