// Load environment variables with correct path
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { supabaseAdmin } = require('./config/supabase');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  
  try {
    // Test connection by listing buckets
    console.log('\n🪣 Testing Storage Access...');
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase Storage');
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    // Check if transaction-attachments bucket exists
    const transactionBucket = buckets.find(b => b.name === 'transaction-attachments');
    if (transactionBucket) {
      console.log('✅ transaction-attachments bucket exists');
    } else {
      console.log('⚠️  transaction-attachments bucket does not exist - will be created automatically');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Supabase connection test passed!');
    } else {
      console.log('\n💥 Supabase connection test failed!');
      console.log('\n🔧 To fix this:');
      console.log('1. Make sure your .env file has the correct Supabase credentials:');
      console.log('   SUPABASE_URL=https://your-project.supabase.co');
      console.log('   SUPABASE_ANON_KEY=your-anon-key');
      console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
      console.log('2. Restart your backend server after updating .env');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test script error:', error);
    process.exit(1);
  });
