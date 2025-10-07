const mongoose = require('mongoose');
const User = require('./models/User');

const testLogin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/money-tracker';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if user exists
    const email = 'shinchan@gmail.com';
    const user = await User.findByEmail(email);
    
    if (user) {
      console.log('✅ User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt
      });
    } else {
      console.log('❌ User not found. Creating new user...');
      
      // Create new user
      const newUser = new User({
        name: 'Shinchan',
        email: email,
        password: 'password123' // This will be hashed automatically
      });
      
      await newUser.save();
      console.log('✅ User created successfully:', {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      });
    }
    
    // Test password comparison
    const testUser = await User.findByEmailWithPassword(email);
    if (testUser) {
      const isValidPassword = await testUser.comparePassword('password123');
      console.log('🔐 Password test result:', isValidPassword ? '✅ Valid' : '❌ Invalid');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

testLogin();
