const axios = require('axios');

/**
 * Fetch real-time exchange rates from ExchangeRate-API
 * @param {string} baseCurrency - Base currency (e.g., 'USD')
 * @returns {Promise<Object>} Exchange rates object
 */
const getExchangeRates = async (baseCurrency = 'USD') => {
  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    return response.data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw new Error('Failed to fetch exchange rates');
  }
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {Promise<number>} Converted amount
 */
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      throw new Error(`Exchange rate for ${toCurrency} not found`);
    }

    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw new Error('Failed to convert currency');
  }
};

/**
 * Convert transaction amounts to a target currency
 * @param {Array} transactions - Array of transaction objects
 * @param {string} targetCurrency - Target currency
 * @returns {Promise<Array>} Transactions with converted amounts
 */
const convertTransactions = async (transactions, targetCurrency) => {
  try {
    const convertedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const convertedAmount = await convertCurrency(
          transaction.amount,
          transaction.currency || 'USD',
          targetCurrency
        );
        return {
          ...transaction,
          convertedAmount,
          targetCurrency
        };
      })
    );
    return convertedTransactions;
  } catch (error) {
    console.error('Error converting transactions:', error);
    throw new Error('Failed to convert transactions');
  }
};

module.exports = {
  getExchangeRates,
  convertCurrency,
  convertTransactions
};
