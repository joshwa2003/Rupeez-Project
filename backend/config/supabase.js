// Load environment variables first with correct path
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-key';

// Create Supabase client with anon key (for general use)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client with service role key (for backend operations that bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = {
  supabase,        // Regular client with anon key
  supabaseAdmin    // Admin client with service role key (bypasses RLS)
};
