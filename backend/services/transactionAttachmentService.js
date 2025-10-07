const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class TransactionAttachmentService {
  constructor() {
    this.bucketName = 'transaction-attachments';
  }

  /**
   * Upload attachment to Supabase Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} userId - User ID for organizing files
   * @param {string} transactionId - Transaction ID for organizing files
   * @returns {Promise<{success: boolean, url?: string, path?: string, error?: string}>}
   */
  async uploadAttachment(fileBuffer, fileName, userId, transactionId) {
    try {
      // Generate unique filename
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${userId}/${transactionId}/${uuidv4()}.${fileExtension}`;

      // Upload to Supabase Storage using admin client (bypasses RLS)
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .upload(uniqueFileName, fileBuffer, {
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
      console.error('Transaction attachment upload error:', error);
      return {
        success: false,
        error: 'Failed to upload attachment'
      };
    }
  }

  /**
   * Delete attachment from Supabase Storage
   * @param {string} attachmentPath - Path to the attachment in storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteAttachment(attachmentPath) {
    try {
      // Extract path from URL if it's a full URL
      let filePath = attachmentPath;
      if (attachmentPath.includes('supabase')) {
        const urlParts = attachmentPath.split('/');
        const bucketIndex = urlParts.findIndex(part => part === this.bucketName);
        if (bucketIndex !== -1) {
          filePath = urlParts.slice(bucketIndex + 1).join('/');
        }
      }

      const { error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .remove([filePath]);

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
      console.error('Attachment delete service error:', error);
      return {
        success: false,
        error: 'Failed to delete attachment'
      };
    }
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
      'webp': 'image/webp',
      'pdf': 'application/pdf'
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Validate attachment file
   * @param {string} fileName - File name
   * @param {number} fileSize - File size in bytes
   * @returns {{valid: boolean, error?: string}}
   */
  validateAttachment(fileName, fileSize) {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const extension = fileName.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPG, PNG, GIF, WebP, and PDF are allowed.'
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

  /**
   * Create bucket if it doesn't exist
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async createBucketIfNotExists() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return { success: false, error: listError.message };
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { data, error: createError } = await supabaseAdmin.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return { success: false, error: createError.message };
        }

        console.log(`Created bucket: ${this.bucketName}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Bucket creation error:', error);
      return { success: false, error: 'Failed to create bucket' };
    }
  }
}

module.exports = new TransactionAttachmentService();
