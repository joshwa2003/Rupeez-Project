import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isAuthenticated, getAuthToken, setAuthToken, getUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (token) {
        // Simple token check without API call to prevent infinite loops
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setAuthenticated(true);
          } catch (e) {
            console.error('Error parsing stored user data:', e);
            logout();
          }
        } else {
          // Only make API call if no stored user data
          try {
            const userData = await getUser();
            if (userData) {
              setUser(userData);
              setAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(userData));
            } else {
              logout();
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            logout();
          }
        }
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Check authentication status on mount only
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = (token, userData) => {
    setAuthToken(token);
    setUser(userData);
    setAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    authenticated,
    loading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
