const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class ImageUploadService {
  constructor() {
    this.bucketName = 'profile-images';
  }

  /**
   * Upload image to Supabase Storage
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} fileName - Original file name
   * @param {string} userId - User ID for organizing files
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadProfileImage(imageBuffer, fileName, userId) {
    try {
      // Generate unique filename
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${userId}/${uuidv4()}.${fileExtension}`;

      // Upload to Supabase Storage using admin client (bypasses RLS)
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .upload(uniqueFileName, imageBuffer, {
          contentType: this.getContentType(fileExtension),
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(this.bucketName)
        .getPublicUrl(uniqueFileName);

      return {
        success: true,
        url: urlData.publicUrl,
        path: uniqueFileName
      };

    } catch (error) {
      console.error('Image upload service error:', error);
      return {
        success: false,
        error: 'Failed to upload image'
      };
    }
  }

  /**
   * Delete image from Supabase Storage
   * @param {string} imagePath - Path to the image in storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteProfileImage(imagePath) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .remove([imagePath]);

      if (error) {
        console.error('Supabase delete error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Image delete service error:', error);
      return {
        success: false,
        error: 'Failed to delete image'
      };
    }
  }

  /**
   * Convert base64 to buffer
   * @param {string} base64String - Base64 encoded image
   * @returns {Buffer}
   */
  base64ToBuffer(base64String) {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  /**
   * Get content type based on file extension
   * @param {string} extension - File extension
   * @returns {string}
   */
  getContentType(extension) {
    const contentTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };

    return contentTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Validate image file
   * @param {string} fileName - File name
   * @param {number} fileSize - File size in bytes
   * @returns {{valid: boolean, error?: string}}
   */
  validateImage(fileName, fileSize) {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const extension = fileName.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'
      };
    }

    if (fileSize > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 5MB.'
      };
    }

    return { valid: true };
  }
}

module.exports = new ImageUploadService();
