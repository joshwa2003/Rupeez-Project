const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const imageUploadService = require('../services/imageUpload');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      profilePicture: user.avatar, // Return as profilePicture for frontend compatibility
      phone: user.phone || '',
      address: user.address || '',
      joinDate: user.createdAt,
      lastLogin: user.lastLogin,
      preferences: user.preferences,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      status: 'success',
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, avatar, profilePicture } = req.body;

    // Validation
    if (name !== undefined && name.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Name cannot be empty'
      });
    }

    // Find and update user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Handle profile picture upload to Supabase
    let newAvatarUrl = user.avatar;
    let newAvatarPath = user.avatarPath;

    if (profilePicture && profilePicture.startsWith('data:image/')) {
      try {
        // Convert base64 to buffer
        const imageBuffer = imageUploadService.base64ToBuffer(profilePicture);
        
        // Generate filename
        const fileName = `profile-${user._id}-${Date.now()}.jpg`;
        
        // Validate image
        const validation = imageUploadService.validateImage(fileName, imageBuffer.length);
        if (!validation.valid) {
          return res.status(400).json({
            status: 'error',
            message: validation.error
          });
        }

        // Upload to Supabase
        const uploadResult = await imageUploadService.uploadProfileImage(
          imageBuffer, 
          fileName, 
          user._id.toString()
        );

        if (!uploadResult.success) {
          return res.status(500).json({
            status: 'error',
            message: uploadResult.error || 'Failed to upload profile picture'
          });
        }

        // Delete old image if exists
        if (user.avatarPath) {
          await imageUploadService.deleteProfileImage(user.avatarPath);
        }

        newAvatarUrl = uploadResult.url;
        newAvatarPath = uploadResult.path;

      } catch (uploadError) {
        console.error('Profile picture upload error:', uploadError);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to process profile picture'
        });
      }
    }

    // Update fields if provided
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;
    
    // Update avatar from Supabase upload
    if (newAvatarUrl !== user.avatar) {
      user.avatar = newAvatarUrl;
      user.avatarPath = newAvatarPath;
    }

    // Save updated user
    await user.save();

    // Return updated profile
    const updatedProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      profilePicture: user.avatar, // Return as profilePicture for frontend compatibility
      phone: user.phone,
      address: user.address,
      preferences: user.preferences,
      updatedAt: user.updatedAt
    };

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedProfile
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Server error while updating profile'
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user with password
    const user = await User.findByEmailWithPassword(req.user.email);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while changing password'
    });
  }
});

// @route   GET /api/users/settings
// @desc    Get user settings
// @access  Private
router.get('/settings', authenticateToken, (req, res) => {
  try {
    const userSettings = {
      notifications: {
        email: true,
        push: false,
        sms: true
      },
      privacy: {
        profileVisible: true,
        dataSharing: false
      },
      security: {
        twoFactorEnabled: false,
        loginAlerts: true
      },
      preferences: {
        theme: 'light',
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY'
      }
    };

    res.json({
      status: 'success',
      data: {
        settings: userSettings
      }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching settings'
    });
  }
});

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', authenticateToken, (req, res) => {
  try {
    const { notifications, privacy, security, preferences } = req.body;

    // Updated settings (demo response)
    const updatedSettings = {
      notifications: notifications || {
        email: true,
        push: false,
        sms: true
      },
      privacy: privacy || {
        profileVisible: true,
        dataSharing: false
      },
      security: security || {
        twoFactorEnabled: false,
        loginAlerts: true
      },
      preferences: preferences || {
        theme: 'light',
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY'
      },
      updatedAt: new Date()
    };

    res.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: {
        settings: updatedSettings
      }
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating settings'
    });
  }
});

module.exports = router;
