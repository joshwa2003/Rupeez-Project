const imageUploadService = require('./services/imageUpload');
const fs = require('fs');
const path = require('path');

async function testSupabaseUpload() {
  console.log('🧪 Testing Supabase Image Upload Service...\n');

  try {
    // Test 1: Create a simple test image buffer (1x1 pixel PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('📝 Test 1: Base64 to Buffer Conversion');
    const imageBuffer = imageUploadService.base64ToBuffer(testImageBase64);
    console.log('✅ Buffer created, size:', imageBuffer.length, 'bytes\n');

    // Test 2: Validate image
    console.log('📝 Test 2: Image Validation');
    const validation = imageUploadService.validateImage('test.png', imageBuffer.length);
    console.log('✅ Validation result:', validation, '\n');

    // Test 3: Content type detection
    console.log('📝 Test 3: Content Type Detection');
    const contentType = imageUploadService.getContentType('png');
    console.log('✅ Content type for PNG:', contentType, '\n');

    // Test 4: Upload to Supabase (only if environment variables are set)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      console.log('📝 Test 4: Supabase Upload');
      const testUserId = 'test-user-123';
      const uploadResult = await imageUploadService.uploadProfileImage(
        imageBuffer,
        'test-profile.png',
        testUserId
      );

      if (uploadResult.success) {
        console.log('✅ Upload successful!');
        console.log('   URL:', uploadResult.url);
        console.log('   Path:', uploadResult.path, '\n');

        // Test 5: Delete the uploaded image
        console.log('📝 Test 5: Supabase Delete');
        const deleteResult = await imageUploadService.deleteProfileImage(uploadResult.path);
        
        if (deleteResult.success) {
          console.log('✅ Delete successful!\n');
        } else {
          console.log('❌ Delete failed:', deleteResult.error, '\n');
        }
      } else {
        console.log('❌ Upload failed:', uploadResult.error, '\n');
      }
    } else {
      console.log('⚠️  Test 4 & 5 Skipped: Supabase environment variables not set');
      console.log('   Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file\n');
    }

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  testSupabaseUpload().then(() => {
    console.log('\n✨ Test execution finished');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = testSupabaseUpload;
