const mongoose = require('mongoose');
const User = require('./models/User');

const resetPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/money-tracker';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find user and reset password
    const email = 'shinchan@gmail.com';
    const user = await User.findByEmailWithPassword(email);
    
    if (user) {
      console.log('✅ User found:', user.name);
      
      // Reset password to 'password123'
      user.password = 'password123';
      await user.save();
      
      console.log('✅ Password reset successfully');
      
      // Test the new password
      const testUser = await User.findByEmailWithPassword(email);
      const isValidPassword = await testUser.comparePassword('password123');
      console.log('🔐 New password test result:', isValidPassword ? '✅ Valid' : '❌ Invalid');
      
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

resetPassword();
