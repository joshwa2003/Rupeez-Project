// Category Service - Ready for backend API integration
// This file provides functions to interact with category data
// Currently uses local state, but can be easily modified to use API calls

/**
 * Category Service for managing expense and income categories
 * 
 * This service provides a clean interface for category operations
 * and can be easily modified to work with your backend API.
 */

// Base API URL - update this to match your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Fetch all categories from the backend
 * @returns {Promise<Array>} Array of category objects
 */
export const fetchCategories = async () => {
  try {
    // For now, return sample data
    // Replace this with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Food & Dining', type: 'expense' },
          { id: 2, name: 'Transportation', type: 'expense' },
          { id: 3, name: 'Shopping', type: 'expense' },
          { id: 4, name: 'Salary', type: 'income' },
          { id: 5, name: 'Freelance', type: 'income' },
          { id: 6, name: 'Bills & Utilities', type: 'expense' }
        ]);
      }, 500); // Simulate network delay
    });

    // Uncomment below when backend API is ready:
    /*
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: createHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
    */
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Create a new category
 * @param {Object} categoryData - The category data to create
 * @param {string} categoryData.name - Category name
 * @param {string} categoryData.type - Category type ('income' or 'expense')
 * @returns {Promise<Object>} Created category object with ID
 */
export const createCategory = async (categoryData) => {
  try {
    // For now, simulate category creation
    // Replace this with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCategory = {
          id: Date.now(), // Simple ID generation for demo
          ...categoryData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        resolve(newCategory);
      }, 300);
    });

    // Uncomment below when backend API is ready:
    /*
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(categoryData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
    */
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update an existing category
 * @param {number} categoryId - The ID of the category to update
 * @param {Object} categoryData - The updated category data
 * @param {string} categoryData.name - Category name
 * @param {string} categoryData.type - Category type ('income' or 'expense')
 * @returns {Promise<Object>} Updated category object
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    // For now, simulate category update
    // Replace this with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedCategory = {
          id: categoryId,
          ...categoryData,
          updatedAt: new Date().toISOString()
        };
        resolve(updatedCategory);
      }, 300);
    });

    // Uncomment below when backend API is ready:
    /*
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(categoryData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
    */
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Delete a category
 * @param {number} categoryId - The ID of the category to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteCategory = async (categoryId) => {
  try {
    // For now, simulate category deletion
    // Replace this with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 300);
    });

    // Uncomment below when backend API is ready:
    /*
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: createHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
    */
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

/**
 * Get categories by type
 * @param {string} type - Category type ('income' or 'expense')
 * @returns {Promise<Array>} Array of filtered category objects
 */
export const getCategoriesByType = async (type) => {
  try {
    const categories = await fetchCategories();
    return categories.filter(category => category.type === type);
  } catch (error) {
    console.error('Error fetching categories by type:', error);
    throw error;
  }
};

/**
 * Search categories by name
 * @param {string} searchTerm - Search term to filter categories
 * @returns {Promise<Array>} Array of matching category objects
 */
export const searchCategories = async (searchTerm) => {
  try {
    const categories = await fetchCategories();
    const lowercaseSearch = searchTerm.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(lowercaseSearch)
    );
  } catch (error) {
    console.error('Error searching categories:', error);
    throw error;
  }
};

/**
 * Validate category data
 * @param {Object} categoryData - Category data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateCategoryData = (categoryData) => {
  const errors = {};

  // Validate name
  if (!categoryData.name || !categoryData.name.trim()) {
    errors.name = 'Category name is required';
  } else if (categoryData.name.trim().length < 2) {
    errors.name = 'Category name must be at least 2 characters';
  } else if (categoryData.name.trim().length > 50) {
    errors.name = 'Category name must be less than 50 characters';
  }

  // Validate type
  if (!categoryData.type || !['income', 'expense'].includes(categoryData.type)) {
    errors.type = 'Category type must be either "income" or "expense"';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get category statistics
 * @returns {Promise<Object>} Statistics object with counts
 */
export const getCategoryStats = async () => {
  try {
    const categories = await fetchCategories();
    
    const stats = {
      total: categories.length,
      income: categories.filter(cat => cat.type === 'income').length,
      expense: categories.filter(cat => cat.type === 'expense').length
    };

    return stats;
  } catch (error) {
    console.error('Error getting category stats:', error);
    throw error;
  }
};

// Export default object with all functions
const categoryService = {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType,
  searchCategories,
  validateCategoryData,
  getCategoryStats
};

export default categoryService;
