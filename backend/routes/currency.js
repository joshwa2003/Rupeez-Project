const express = require('express');
const { getExchangeRates, convertCurrency, convertTransactions } = require('../services/currencyService');
const { getAllTransactions } = require('../services/transactionService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/currency/rates/:baseCurrency
 * Get exchange rates for a base currency
 */
router.get('/rates/:baseCurrency', async (req, res) => {
  try {
    const { baseCurrency } = req.params;
    const rates = await getExchangeRates(baseCurrency);
    res.json({ rates, baseCurrency });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/currency/convert
 * Convert amount between currencies
 */
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
    res.json({ convertedAmount, fromCurrency, toCurrency });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/currency/convert-transactions
 * Convert all user transactions to a target currency
 */
router.post('/convert-transactions', async (req, res) => {
  try {
    const { targetCurrency } = req.body;
    const userId = req.user.userId;
    const transactions = await getAllTransactions(userId);
    const convertedTransactions = await convertTransactions(transactions, targetCurrency);
    res.json({ transactions: convertedTransactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
