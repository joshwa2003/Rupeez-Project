# Supabase Setup Guide for Profile Images

This guide will help you set up Supabase for storing profile images in your Money Tracker application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project name: `money-tracker`
5. Enter database password (save this securely)
6. Choose region closest to your users
7. Click "Create new project"

## Step 2: Set Up Storage Bucket

1. In your Supabase dashboard, go to "Storage" in the left sidebar
2. Click "Create a new bucket"
3. Bucket name: `profile-images`
4. Set as Public bucket: `Yes`
5. Click "Create bucket"

## Step 3: Configure Bucket Policies (Optional - Using Service Role Key)

Since this application uses custom JWT authentication (not Supabase Auth), we'll use the service role key to bypass Row Level Security (RLS). This is the recommended approach for backend operations.

**Option 1: Disable RLS (Recommended for this setup)**
1. Click on the `profile-images` bucket
2. Go to "Policies" tab
3. Make sure RLS is **disabled** for the bucket (this allows service role key to work without policies)

**Option 2: If you prefer to keep RLS enabled, use these policies:**
```sql
-- Allow service role to manage all files
CREATE POLICY "Service role can manage all files" ON storage.objects
FOR ALL USING (true);

-- Allow public read access to profile images
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');
```

**Note:** Since we're using the service role key in the backend, RLS policies are bypassed automatically. The service role key has full access to all storage operations.

## Step 4: Get API Keys

1. Go to "Settings" > "API" in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - Project API Key (anon, public)
   - **Service Role Key** (secret, for backend use only)

## Step 5: Configure Environment Variables

Create or update your `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Example:
# SUPABASE_URL=https://your-project-id.supabase.co
# SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** The service role key has full access to your Supabase project. Keep it secure and never expose it in client-side code.

## Step 6: Test the Setup

1. Start your backend server
2. Use the profile update endpoint to upload an image
3. Check your Supabase storage bucket to see if the image was uploaded

## File Structure

The uploaded images will be organized as follows:
```
profile-images/
├── user_id_1/
│   ├── uuid1.jpg
│   └── uuid2.png
├── user_id_2/
│   └── uuid3.jpg
└── ...
```

## Security Features

- Images are organized by user ID folders
- Only authenticated users can upload images
- Users can only upload to their own folder
- All profile images are publicly viewable
- Old images are automatically deleted when new ones are uploaded
- File size limit: 5MB
- Supported formats: JPG, PNG, GIF, WebP

## Troubleshooting

### Common Issues:

1. **Upload fails with "Access denied"**
   - Check if the bucket policies are correctly set
   - Verify the bucket is set to public

2. **Images not displaying**
   - Check if the public URL is correctly generated
   - Verify the bucket name matches in your code

3. **Environment variables not loaded**
   - Make sure `.env` file is in the backend root directory
   - Restart your server after adding environment variables

### Testing Commands:

```bash
# Test Supabase connection
node -e "
const supabase = require('./config/supabase');
console.log('Supabase client created:', !!supabase);
"

# Test image upload service
node -e "
const imageService = require('./services/imageUpload');
console.log('Image service loaded:', !!imageService);
"
```

## Next Steps

After completing this setup:

1. Test profile image upload through your frontend
2. Monitor storage usage in Supabase dashboard
3. Consider implementing image optimization for better performance
4. Set up CDN if needed for global image delivery

## Support

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs
2. Review the error logs in your backend console
3. Check the browser network tab for API errors
