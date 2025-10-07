const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
friendSchema.index({ userId: 1, email: 1 });
friendSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Friend', friendSchema);
