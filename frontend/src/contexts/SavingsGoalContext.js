import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const SavingsGoalContext = createContext();

// Custom hook to use the savings goal context
export const useSavingsGoals = () => {
  const context = useContext(SavingsGoalContext);
  if (!context) {
    throw new Error('useSavingsGoals must be used within a SavingsGoalProvider');
  }
  return context;
};

// SavingsGoal Provider component
export const SavingsGoalProvider = ({ children }) => {
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

  // Fetch savings goals from API
  const fetchSavingsGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/savings-goals`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch savings goals');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setSavingsGoals(data.data.savingsGoals || []);
      }
    } catch (error) {
      console.error('Error fetching savings goals:', error);
      setError(error.message);
      // Fallback to localStorage if API fails
      try {
        const savedGoals = localStorage.getItem('money-tracker-savings-goals');
        if (savedGoals) {
          setSavingsGoals(JSON.parse(savedGoals));
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load savings goals on component mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchSavingsGoals();
    } else {
      // Load from localStorage if no token
      try {
        const savedGoals = localStorage.getItem('money-tracker-savings-goals');
        if (savedGoals) {
          setSavingsGoals(JSON.parse(savedGoals));
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage as backup
  useEffect(() => {
    try {
      localStorage.setItem('money-tracker-savings-goals', JSON.stringify(savingsGoals));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [savingsGoals]);

  // Add a new savings goal
  const addSavingsGoal = async (goalData) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        const newGoal = {
          id: Date.now().toString(),
          ...goalData,
          currentAmount: 0,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        setSavingsGoals(prev => [newGoal, ...prev]);
        return newGoal;
      }

      const response = await fetch(`${API_BASE_URL}/savings-goals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(goalData)
      });

      if (!response.ok) {
        throw new Error('Failed to create savings goal');
      }

      const data = await response.json();
      if (data.status === 'success') {
        const newGoal = data.data.savingsGoal;
        setSavingsGoals(prev => [newGoal, ...prev]);
        return newGoal;
      }
    } catch (error) {
      console.error('Error creating savings goal:', error);
      setError(error.message);
      // Fallback to localStorage
      const newGoal = {
        id: Date.now().toString(),
        ...goalData,
        currentAmount: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      setSavingsGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing savings goal
  const updateSavingsGoal = async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        setSavingsGoals(prev =>
          prev.map(goal =>
            goal.id === id || goal._id === id
              ? { ...goal, ...updatedData, updatedAt: new Date().toISOString() }
              : goal
          )
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/savings-goals/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Failed to update savings goal');
      }

      const data = await response.json();
      if (data.status === 'success') {
        const updatedGoal = data.data.savingsGoal;
        setSavingsGoals(prev =>
          prev.map(goal =>
            goal.id === id || goal._id === id ? updatedGoal : goal
          )
        );
      }
    } catch (error) {
      console.error('Error updating savings goal:', error);
      setError(error.message);
      // Fallback to localStorage
      setSavingsGoals(prev =>
        prev.map(goal =>
          goal.id === id || goal._id === id
            ? { ...goal, ...updatedData, updatedAt: new Date().toISOString() }
            : goal
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Add money to savings goal
  const addSavings = async (id, amount) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        setSavingsGoals(prev =>
          prev.map(goal => {
            if (goal.id === id || goal._id === id) {
              const newCurrentAmount = goal.currentAmount + parseFloat(amount);
              const status = newCurrentAmount >= goal.targetAmount ? 'completed' : goal.status;
              return { 
                ...goal, 
                currentAmount: newCurrentAmount,
                status,
                updatedAt: new Date().toISOString() 
              };
            }
            return goal;
          })
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/savings-goals/${id}/add-savings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount })
      });

      if (!response.ok) {
        throw new Error('Failed to add savings');
      }

      const data = await response.json();
      if (data.status === 'success') {
        const updatedGoal = data.data.savingsGoal;
        setSavingsGoals(prev =>
          prev.map(goal =>
            goal.id === id || goal._id === id ? updatedGoal : goal
          )
        );
      }
    } catch (error) {
      console.error('Error adding savings:', error);
      setError(error.message);
      // Fallback to localStorage
      setSavingsGoals(prev =>
        prev.map(goal => {
          if (goal.id === id || goal._id === id) {
            const newCurrentAmount = goal.currentAmount + parseFloat(amount);
            const status = newCurrentAmount >= goal.targetAmount ? 'completed' : goal.status;
            return { 
              ...goal, 
              currentAmount: newCurrentAmount,
              status,
              updatedAt: new Date().toISOString() 
            };
          }
          return goal;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete a savings goal
  const deleteSavingsGoal = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        setSavingsGoals(prev => prev.filter(goal => goal.id !== id && goal._id !== id));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/savings-goals/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete savings goal');
      }

      setSavingsGoals(prev => prev.filter(goal => goal.id !== id && goal._id !== id));
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      setError(error.message);
      // Fallback to localStorage
      setSavingsGoals(prev => prev.filter(goal => goal.id !== id && goal._id !== id));
    } finally {
      setLoading(false);
    }
  };

  // Get active savings goals
  const getActiveSavingsGoals = () => {
    return savingsGoals.filter(goal => goal.status === 'active');
  };

  // Get completed savings goals
  const getCompletedSavingsGoals = () => {
    return savingsGoals.filter(goal => goal.status === 'completed');
  };

  // Clear all savings goals
  const clearSavingsGoals = () => {
    setSavingsGoals([]);
  };

  const value = {
    savingsGoals,
    loading,
    error,
    addSavingsGoal,
    updateSavingsGoal,
    addSavings,
    deleteSavingsGoal,
    getActiveSavingsGoals,
    getCompletedSavingsGoals,
    clearSavingsGoals,
    fetchSavingsGoals
  };

  return (
    <SavingsGoalContext.Provider value={value}>
      {children}
    </SavingsGoalContext.Provider>
  );
};

export default SavingsGoalContext;
