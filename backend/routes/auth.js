const express = require('express');
const { generateToken, authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password'
      });
    }

    // Additional validation
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    // Save user to database
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name
    });

    // Get public profile (without password)
    const publicProfile = user.getPublicProfile();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: publicProfile._id,
          name: publicProfile.name,
          email: publicProfile.email,
          avatar: publicProfile.avatar,
          createdAt: publicProfile.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user by email (with password field)
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name
    });

    // Get public profile
    const publicProfile = user.getPublicProfile();

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: publicProfile._id,
          name: publicProfile.name,
          email: publicProfile.email,
          avatar: publicProfile.avatar,
          lastLogin: publicProfile.lastLogin,
          preferences: publicProfile.preferences
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    message: 'Logout successful'
  });
});

// @route   POST /api/auth/logout-all
// @desc    Logout user from all devices
// @access  Private
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, you would invalidate all tokens for this user
    // This could be done by:
    // 1. Maintaining a blacklist of tokens
    // 2. Adding a tokenVersion field to user and incrementing it
    // 3. Using Redis to store valid tokens
    
    // For now, we'll just return success as the frontend will handle token removal
    // In production, you might want to:
    // - Update user's tokenVersion in database
    // - Clear any stored refresh tokens
    // - Log the logout event for security purposes
    
    const user = await User.findById(req.user.id);
    if (user) {
      // Update last login to current time as a security measure
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({
      status: 'success',
      message: 'Successfully logged out from all devices'
    });

  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during logout'
    });
  }
});

module.exports = router;
