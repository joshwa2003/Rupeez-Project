// Currency service for handling exchange rates and currency conversion
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

// Common currencies with their symbols
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira' }
};

// Cache for exchange rates to avoid too many API calls
let exchangeRateCache = {
  data: null,
  timestamp: null,
  baseCurrency: null
};

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Get exchange rates from API or cache
 * @param {string} baseCurrency - Base currency code (default: USD)
 * @returns {Promise<Object>} Exchange rates object
 */
export const getExchangeRates = async (baseCurrency = 'INR') => {
  const now = Date.now();
  
  // Check if we have valid cached data for the same base currency
  if (
    exchangeRateCache.data &&
    exchangeRateCache.timestamp &&
    exchangeRateCache.baseCurrency === baseCurrency &&
    (now - exchangeRateCache.timestamp) < CACHE_DURATION
  ) {
    return exchangeRateCache.data;
  }

  try {
    const response = await fetch(`${EXCHANGE_RATE_API_URL}/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update cache
    exchangeRateCache = {
      data: data,
      timestamp: now,
      baseCurrency: baseCurrency
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // If we have cached data (even if expired), use it as fallback
    if (exchangeRateCache.data && exchangeRateCache.baseCurrency === baseCurrency) {
      console.warn('Using cached exchange rates due to API error');
      return exchangeRateCache.data;
    }
    
    // Return mock data as last resort
    return {
      base: baseCurrency,
      rates: {
        USD: baseCurrency === 'USD' ? 1 : 1,
        EUR: baseCurrency === 'EUR' ? 1 : 0.85,
        GBP: baseCurrency === 'GBP' ? 1 : 0.73,
        JPY: baseCurrency === 'JPY' ? 1 : 110,
        INR: baseCurrency === 'INR' ? 1 : 74
      }
    };
  }
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const exchangeData = await getExchangeRates(fromCurrency);
    const rate = exchangeData.rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    return amount; // Return original amount if conversion fails
  }
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @returns {string} Formatted amount with symbol
 */
export const formatCurrency = (amount, currencyCode) => {
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    return `${amount} ${currencyCode}`;
  }
  
  // Format number with appropriate decimal places
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${currency.symbol}${formattedAmount}`;
};

/**
 * Get currency symbol by code
 * @param {string} currencyCode - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  const currency = CURRENCIES[currencyCode];
  return currency ? currency.symbol : currencyCode;
};

/**
 * Get currency name by code
 * @param {string} currencyCode - Currency code
 * @returns {string} Currency name
 */
export const getCurrencyName = (currencyCode) => {
  const currency = CURRENCIES[currencyCode];
  return currency ? currency.name : currencyCode;
};

/**
 * Get list of supported currencies for dropdown
 * @returns {Array} Array of currency objects
 */
export const getSupportedCurrencies = () => {
  return Object.values(CURRENCIES);
};

/**
 * Validate currency code
 * @param {string} currencyCode - Currency code to validate
 * @returns {boolean} True if valid currency code
 */
export const isValidCurrency = (currencyCode) => {
  return Object.hasOwnProperty.call(CURRENCIES, currencyCode);
};
