const cron = require('node-cron');
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');
const notificationService = require('./notificationService');

class RecurringTransactionScheduler {
  constructor() {
    this.isProcessing = false;
    this.jobs = [];
  }

  /**
   * Start the scheduler - runs once daily at midnight
   */
  start() {
    // Run once at midnight (end of day)
    const dailyJob = cron.schedule('0 0 * * *', async () => {
      console.log('[Scheduler] Running daily recurring transaction check...');
      await this.processRecurringTransactions();
    });

    this.jobs.push(dailyJob);
    
    console.log('✓ Recurring transaction scheduler started');
    console.log('  - Daily check: Every day at midnight (00:00)');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('✓ Recurring transaction scheduler stopped');
  }

  /**
   * Main processing function
   */
  async processRecurringTransactions() {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[Scheduler] Already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();
    let processed = 0;
    let created = 0;
    const errors = [];

    try {
      const now = new Date();
      
      // Find all active recurring transactions that are due
      const dueTransactions = await RecurringTransaction.find({
        status: 'active',
        nextOccurrence: { $lte: now },
        $or: [
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      });

      console.log(`[Scheduler] Found ${dueTransactions.length} due recurring transactions`);

      for (const recurring of dueTransactions) {
        try {
          // Check if already processed today (prevent duplicates)
          if (this.wasProcessedToday(recurring.lastProcessed)) {
            console.log(`[Scheduler] Skipping ${recurring._id} - already processed today`);
            continue;
          }

          // Generate the transaction
          const transaction = await this.createTransactionFromRecurring(recurring);
          created++;

          // Update recurring transaction
          recurring.lastProcessed = now;
          recurring.totalOccurrences += 1;
          recurring.nextOccurrence = recurring.calculateNextOccurrence();

          // Check if recurring should be completed
          if (recurring.endDate && recurring.nextOccurrence > recurring.endDate) {
            recurring.status = 'completed';
            console.log(`[Scheduler] Recurring ${recurring._id} completed (reached end date)`);
          }

          await recurring.save();

          // Send notification if enabled
          if (recurring.notifyUser) {
            await notificationService.sendRecurringTransactionNotification(
              recurring.userId,
              transaction,
              recurring
            );
          }

          processed++;
          console.log(`[Scheduler] ✓ Created transaction ${transaction._id} from recurring ${recurring._id}`);
        } catch (error) {
          console.error(`[Scheduler] ✗ Error processing recurring transaction ${recurring._id}:`, error);
          errors.push({
            recurringTransactionId: recurring._id,
            error: error.message,
            timestamp: now
          });
          
          // Send error notification to user
          await notificationService.sendRecurringTransactionError(
            recurring.userId,
            recurring,
            error
          );
        }
      }

      // Log processing results
      const duration = Date.now() - startTime;
      console.log(`[Scheduler] ✓ Processed ${processed}/${dueTransactions.length} recurring transactions`);
      console.log(`[Scheduler] ✓ Created ${created} new transactions in ${duration}ms`);
      
      if (errors.length > 0) {
        console.log(`[Scheduler] ✗ ${errors.length} errors occurred`);
      }

    } catch (error) {
      console.error('[Scheduler] ✗ Fatal error in recurring transaction processor:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Create a transaction from a recurring template
   */
  async createTransactionFromRecurring(recurring) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if transaction already exists for today (duplicate prevention)
    const existing = await Transaction.findOne({
      userId: recurring.userId,
      recurringTransactionId: recurring._id,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (existing) {
      console.log(`[Scheduler] Transaction already exists for recurring ${recurring._id}`);
      return existing;
    }
    
    // Create new transaction
    const transaction = new Transaction({
      userId: recurring.userId,
      type: recurring.type,
      amount: recurring.amount,
      currency: recurring.currency,
      category: recurring.category,
      paymentMethod: recurring.paymentMethod,
      notes: recurring.notes ? `${recurring.notes} (Recurring)` : 'Auto-generated recurring transaction',
      status: recurring.autoApprove ? 'completed' : 'pending',
      date: new Date(),
      recurringTransactionId: recurring._id
    });

    return await transaction.save();
  }

  /**
   * Check if recurring transaction was already processed today
   */
  wasProcessedToday(lastProcessed) {
    if (!lastProcessed) return false;
    
    const today = new Date();
    const processed = new Date(lastProcessed);
    
    return today.toDateString() === processed.toDateString();
  }

  /**
   * Manual trigger for testing or admin purposes
   */
  async triggerManualProcess() {
    console.log('[Scheduler] Manual process triggered');
    await this.processRecurringTransactions();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.jobs.length > 0,
      processing: this.isProcessing,
      jobCount: this.jobs.length
    };
  }
}

module.exports = new RecurringTransactionScheduler();
