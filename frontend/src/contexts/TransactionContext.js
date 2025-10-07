import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const TransactionContext = createContext();

// Custom hook to use the transaction context
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

// Transaction Provider component
export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // API headers with auth token
  const getHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setTransactions(data.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.message);
      // Fallback to localStorage if API fails
      try {
        const savedTransactions = localStorage.getItem('money-tracker-transactions');
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load transactions on component mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchTransactions();
    } else {
      // Load from localStorage if no token
      try {
        const savedTransactions = localStorage.getItem('money-tracker-transactions');
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage as backup
  useEffect(() => {
    try {
      localStorage.setItem('money-tracker-transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [transactions]);

  // Add a new transaction
  const addTransaction = async (transaction) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        const newTransaction = {
          id: Date.now().toString(),
          ...transaction,
          createdAt: new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);
        return newTransaction;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('type', transaction.type);
      formData.append('amount', transaction.amount);
      formData.append('category', transaction.category);
      formData.append('date', transaction.date);
      formData.append('paymentMethod', transaction.paymentMethod || 'cash');
      formData.append('notes', transaction.notes || '');
      
      // Handle file attachment
      if (transaction.attachment && transaction.attachment instanceof File) {
        formData.append('attachment', transaction.attachment);
      }

      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const data = await response.json();
      if (data.status === 'success') {
        const newTransaction = data.data.transaction;
        setTransactions(prev => [newTransaction, ...prev]);
        return newTransaction;
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError(error.message);
      // Fallback to localStorage
      const newTransaction = {
        id: Date.now().toString(),
        ...transaction,
        createdAt: new Date().toISOString()
      };
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing transaction
  const updateTransaction = async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        setTransactions(prev =>
          prev.map(transaction =>
            transaction.id === id
              ? { ...transaction, ...updatedData, updatedAt: new Date().toISOString() }
              : transaction
          )
        );
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      if (updatedData.type) formData.append('type', updatedData.type);
      if (updatedData.amount !== undefined) formData.append('amount', updatedData.amount);
      if (updatedData.category) formData.append('category', updatedData.category);
      if (updatedData.date) formData.append('date', updatedData.date);
      if (updatedData.paymentMethod) formData.append('paymentMethod', updatedData.paymentMethod);
      if (updatedData.notes !== undefined) formData.append('notes', updatedData.notes);
      if (updatedData.status) formData.append('status', updatedData.status);
      
      // Handle file attachment
      if (updatedData.attachment && updatedData.attachment instanceof File) {
        formData.append('attachment', updatedData.attachment);
      }

      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      const data = await response.json();
      if (data.status === 'success') {
        const updatedTransaction = data.data.transaction;
        setTransactions(prev =>
          prev.map(transaction =>
            transaction.id === id ? updatedTransaction : transaction
          )
        );
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError(error.message);
      // Fallback to localStorage
      setTransactions(prev =>
        prev.map(transaction =>
          transaction.id === id
            ? { ...transaction, ...updatedData, updatedAt: new Date().toISOString() }
            : transaction
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete a transaction
  const deleteTransaction = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError(error.message);
      // Fallback to localStorage
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } finally {
      setLoading(false);
    }
  };

  // Get transactions by type
  const getTransactionsByType = (type) => {
    return transactions.filter(transaction => transaction.type === type);
  };

  // Get transactions by category
  const getTransactionsByCategory = (category) => {
    return transactions.filter(transaction => transaction.category === category);
  };

  // Clear all transactions
  const clearTransactions = () => {
    setTransactions([]);
  };

  const value = {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByType,
    getTransactionsByCategory,
    clearTransactions,
    fetchTransactions
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;
