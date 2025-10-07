const User = require('../models/User');

class NotificationService {
  /**
   * Send notification when a recurring transaction is processed
   */
  async sendRecurringTransactionNotification(userId, transaction, recurring) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        console.warn(`User ${userId} not found for notification`);
        return;
      }
      
      const notification = {
        userId: userId,
        type: 'recurring_transaction_created',
        title: 'Recurring Transaction Processed',
        message: `Your ${recurring.frequency} ${transaction.type} of ${transaction.currency} ${transaction.amount} for ${transaction.category} has been recorded.`,
        data: {
          transactionId: transaction._id,
          recurringTransactionId: recurring._id,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type
        },
        read: false,
        createdAt: new Date()
      };
      
      // Save to in-app notifications (if you have a Notification model)
      await this.saveInAppNotification(notification);
      
      // Send email if enabled
      if (recurring.notificationMethod === 'email' || recurring.notificationMethod === 'both') {
        await this.sendEmail(user.email, notification);
      }
      
      console.log(`✓ Notification sent to user ${userId} for recurring transaction ${recurring._id}`);
    } catch (error) {
      console.error('Error sending recurring transaction notification:', error);
      // Don't throw - notification failure shouldn't stop transaction processing
    }
  }
  
  /**
   * Save in-app notification
   * Note: Implement based on your notification system
   */
  async saveInAppNotification(notification) {
    // TODO: Implement if you have a Notification model
    // For now, just log it
    console.log('In-app notification:', notification.message);
  }
  
  /**
   * Send email notification
   * Note: Implement based on your email provider (SendGrid, Nodemailer, etc.)
   */
  async sendEmail(email, notification) {
    // TODO: Implement email sending
    // For now, just log it
    console.log(`Email notification to ${email}:`, notification.message);
  }
  
  /**
   * Send notification when recurring transaction fails
   */
  async sendRecurringTransactionError(userId, recurring, error) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return;
      }
      
      const notification = {
        userId: userId,
        type: 'recurring_transaction_error',
        title: 'Recurring Transaction Failed',
        message: `Failed to process your ${recurring.frequency} ${recurring.type} for ${recurring.category}. Please check your recurring transaction settings.`,
        data: {
          recurringTransactionId: recurring._id,
          error: error.message
        },
        read: false,
        createdAt: new Date()
      };
      
      await this.saveInAppNotification(notification);
      
      console.log(`✓ Error notification sent to user ${userId}`);
    } catch (err) {
      console.error('Error sending error notification:', err);
    }
  }
}

module.exports = new NotificationService();
