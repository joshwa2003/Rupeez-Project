const mongoose = require('mongoose');
require('dotenv').config();

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/money-tracker';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Create collections by inserting and removing a dummy document
    const collections = ['users', 'transactions', 'invoices', 'billing', 'dashboard'];
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName);
      
      // Insert a dummy document
      await collection.insertOne({ _temp: true });
      
      // Remove the dummy document
      await collection.deleteOne({ _temp: true });
      
      console.log(`✅ Created collection: ${collectionName}`);
    }

    console.log('\n🎉 Database initialization completed!');
    console.log('📁 Database: money-tracker');
    console.log('📊 Collections created: users, transactions, invoices, billing, dashboard');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
