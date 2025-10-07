const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend',
    default: null
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: null
  },
  avatarUrl: {
    type: String,
    default: null
  }
}, { _id: false });

const groupSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true,
    default: ''
  },
  members: [memberSchema],
  defaultCurrency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
groupSchema.index({ userId: 1, isActive: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ 'members.friendId': 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.userId && member.userId.toString() === userId.toString()
  );
};

// Method to get member by ID
groupSchema.methods.getMember = function(memberId) {
  return this.members.find(member => {
    if (memberId.startsWith('u_')) {
      const userId = memberId.replace('u_', '');
      return member.userId && member.userId.toString() === userId;
    } else if (memberId.startsWith('f_')) {
      const friendId = memberId.replace('f_', '');
      return member.friendId && member.friendId.toString() === friendId;
    }
    return false;
  });
};

module.exports = mongoose.model('Group', groupSchema);
