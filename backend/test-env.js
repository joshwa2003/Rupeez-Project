// Load environment variables from the correct path
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Testing Environment Variables...');
console.log('Current working directory:', process.cwd());
console.log('');

console.log('📋 Environment Variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.SUPABASE_ANON_KEY.length + ')' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'NOT SET');

console.log('');
console.log('🔧 Debugging Info:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');

// Check if .env file exists
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
console.log('');
console.log('📄 .env file check:');
console.log('.env path:', envPath);
console.log('.env exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const stats = fs.statSync(envPath);
  console.log('.env size:', stats.size, 'bytes');
  console.log('.env modified:', stats.mtime);
}
