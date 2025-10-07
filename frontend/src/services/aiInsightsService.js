import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class AIInsightsService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/ai`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/auth/signin';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get AI-powered spending insights
   */
  async getSpendingInsights(timeframe = '90d') {
    try {
      const response = await this.api.get('/spending-insights', {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching spending insights:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch spending insights');
    }
  }

  /**
   * Get AI budget recommendations
   */
  async getBudgetRecommendations() {
    try {
      const response = await this.api.get('/budget-recommendations');
      return response.data;
    } catch (error) {
      console.error('Error fetching budget recommendations:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch budget recommendations');
    }
  }

  /**
   * Get category-specific analysis
   */
  async getCategoryAnalysis(category, timeframe = '90d') {
    try {
      const response = await this.api.get(`/category-analysis/${encodeURIComponent(category)}`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching category analysis:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch category analysis');
    }
  }

  /**
   * Get personalized financial tips
   */
  async getFinancialTips() {
    try {
      const response = await this.api.get('/financial-tips');
      return response.data;
    } catch (error) {
      console.error('Error fetching financial tips:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch financial tips');
    }
  }
}

export const aiInsightsService = new AIInsightsService();
