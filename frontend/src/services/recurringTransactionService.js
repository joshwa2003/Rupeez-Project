import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const recurringTransactionService = {
  /**
   * Get all recurring transactions
   * @param {string} status - Optional filter by status (active, paused, completed, cancelled)
   */
  getAll: async (status = null) => {
    const params = status ? { status } : {};
    const response = await axios.get(`${API_URL}/recurring-transactions`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Get single recurring transaction by ID
   * @param {string} id - Recurring transaction ID
   */
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/recurring-transactions/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Create new recurring transaction
   * @param {object} data - Recurring transaction data
   */
  create: async (data) => {
    const response = await axios.post(`${API_URL}/recurring-transactions`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Update recurring transaction
   * @param {string} id - Recurring transaction ID
   * @param {object} data - Updated data
   */
  update: async (id, data) => {
    const response = await axios.put(`${API_URL}/recurring-transactions/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Pause recurring transaction
   * @param {string} id - Recurring transaction ID
   */
  pause: async (id) => {
    const response = await axios.patch(`${API_URL}/recurring-transactions/${id}/pause`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Resume recurring transaction
   * @param {string} id - Recurring transaction ID
   */
  resume: async (id) => {
    const response = await axios.patch(`${API_URL}/recurring-transactions/${id}/resume`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Delete recurring transaction
   * @param {string} id - Recurring transaction ID
   */
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/recurring-transactions/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Get transaction history for a recurring transaction
   * @param {string} id - Recurring transaction ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  getHistory: async (id, page = 1, limit = 10) => {
    const response = await axios.get(`${API_URL}/recurring-transactions/${id}/history`, {
      headers: getAuthHeader(),
      params: { page, limit }
    });
    return response.data;
  },

  /**
   * Get recurring transactions statistics
   */
  getStats: async () => {
    const response = await axios.get(`${API_URL}/recurring-transactions/stats/summary`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default recurringTransactionService;
