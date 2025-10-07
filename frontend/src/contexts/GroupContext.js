import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { groupsAPI } from '../services/api';

const GroupContext = createContext();

// Action types
const GROUP_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_GROUPS: 'SET_GROUPS',
  ADD_GROUP: 'ADD_GROUP',
  UPDATE_GROUP: 'UPDATE_GROUP',
  DELETE_GROUP: 'DELETE_GROUP',
  SET_SELECTED_GROUP: 'SET_SELECTED_GROUP',
  SET_GROUP_EXPENSES: 'SET_GROUP_EXPENSES',
  ADD_GROUP_EXPENSE: 'ADD_GROUP_EXPENSE',
  SET_GROUP_BALANCES: 'SET_GROUP_BALANCES',
  SET_SETTLEMENTS: 'SET_SETTLEMENTS',
  ADD_SETTLEMENT: 'ADD_SETTLEMENT',
  UPDATE_SETTLEMENT: 'UPDATE_SETTLEMENT',
  SET_SETTLEMENT_SUGGESTIONS: 'SET_SETTLEMENT_SUGGESTIONS'
};

// Initial state
const initialState = {
  groups: [],
  selectedGroup: null,
  groupExpenses: [],
  groupBalances: [],
  settlements: [],
  settlementSuggestions: [],
  loading: false,
  error: null
};

// Reducer
const groupReducer = (state, action) => {
  switch (action.type) {
    case GROUP_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case GROUP_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case GROUP_ACTIONS.SET_GROUPS:
      return { ...state, groups: action.payload, loading: false, error: null };
    
    case GROUP_ACTIONS.ADD_GROUP:
      return { ...state, groups: [action.payload, ...state.groups] };
    
    case GROUP_ACTIONS.UPDATE_GROUP:
      return {
        ...state,
        groups: state.groups.map(group =>
          group._id === action.payload._id ? action.payload : group
        ),
        selectedGroup: state.selectedGroup?._id === action.payload._id ? action.payload : state.selectedGroup
      };
    
    case GROUP_ACTIONS.DELETE_GROUP:
      return {
        ...state,
        groups: state.groups.filter(group => group._id !== action.payload),
        selectedGroup: state.selectedGroup?._id === action.payload ? null : state.selectedGroup
      };
    
    case GROUP_ACTIONS.SET_SELECTED_GROUP:
      return { ...state, selectedGroup: action.payload };
    
    case GROUP_ACTIONS.SET_GROUP_EXPENSES:
      return { ...state, groupExpenses: action.payload };
    
    case GROUP_ACTIONS.ADD_GROUP_EXPENSE:
      return { ...state, groupExpenses: [action.payload, ...state.groupExpenses] };
    
    case GROUP_ACTIONS.SET_GROUP_BALANCES:
      return { ...state, groupBalances: action.payload };
    
    case GROUP_ACTIONS.SET_SETTLEMENTS:
      return { ...state, settlements: action.payload };
    
    case GROUP_ACTIONS.ADD_SETTLEMENT:
      return { ...state, settlements: [action.payload, ...state.settlements] };
    
    case GROUP_ACTIONS.UPDATE_SETTLEMENT:
      return {
        ...state,
        settlements: state.settlements.map(settlement =>
          settlement._id === action.payload._id ? action.payload : settlement
        )
      };
    
    case GROUP_ACTIONS.SET_SETTLEMENT_SUGGESTIONS:
      return { ...state, settlementSuggestions: action.payload };
    
    default:
      return state;
  }
};

// Provider component
export const GroupProvider = ({ children }) => {
  const [state, dispatch] = useReducer(groupReducer, initialState);

  // Load groups on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadGroups();
    }
  }, []);

  // Action creators
  const loadGroups = async () => {
    try {
      dispatch({ type: GROUP_ACTIONS.SET_LOADING, payload: true });
      const response = await groupsAPI.getGroups();
      dispatch({ type: GROUP_ACTIONS.SET_GROUPS, payload: response.data.groups });
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const createGroup = async (groupData) => {
    try {
      dispatch({ type: GROUP_ACTIONS.SET_LOADING, payload: true });
      const response = await groupsAPI.createGroup(groupData);
      dispatch({ type: GROUP_ACTIONS.ADD_GROUP, payload: response.data.group });
      return response.data.group;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const updateGroup = async (groupId, groupData) => {
    try {
      const response = await groupsAPI.updateGroup(groupId, groupData);
      dispatch({ type: GROUP_ACTIONS.UPDATE_GROUP, payload: response.data.group });
      return response.data.group;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await groupsAPI.deleteGroup(groupId);
      dispatch({ type: GROUP_ACTIONS.DELETE_GROUP, payload: groupId });
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const selectGroup = (group) => {
    dispatch({ type: GROUP_ACTIONS.SET_SELECTED_GROUP, payload: group });
  };

  const loadGroupExpenses = async (groupId, filters = {}) => {
    try {
      const response = await groupsAPI.getGroupExpenses(groupId, filters);
      dispatch({ type: GROUP_ACTIONS.SET_GROUP_EXPENSES, payload: response.data.expenses });
      return response.data.expenses;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const addGroupExpense = async (groupId, expenseData) => {
    try {
      const response = await groupsAPI.addGroupExpense(groupId, expenseData);
      dispatch({ type: GROUP_ACTIONS.ADD_GROUP_EXPENSE, payload: response.data.expense });
      return response.data.expense;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const loadGroupBalances = async (groupId) => {
    try {
      const response = await groupsAPI.getGroupBalances(groupId);
      dispatch({ type: GROUP_ACTIONS.SET_GROUP_BALANCES, payload: response.data.balances });
      return response.data.balances;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const loadSettlementSuggestions = async (groupId) => {
    try {
      const response = await groupsAPI.getSettlementSuggestions(groupId);
      dispatch({ type: GROUP_ACTIONS.SET_SETTLEMENT_SUGGESTIONS, payload: response.data.suggestions });
      return response.data.suggestions;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const createSettlement = async (groupId, settlementData) => {
    try {
      const response = await groupsAPI.createSettlement(groupId, settlementData);
      dispatch({ type: GROUP_ACTIONS.ADD_SETTLEMENT, payload: response.data.settlement });
      return response.data.settlement;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const completeSettlement = async (groupId, settlementId) => {
    try {
      const response = await groupsAPI.completeSettlement(groupId, settlementId);
      dispatch({ type: GROUP_ACTIONS.UPDATE_SETTLEMENT, payload: response.data.settlement });
      return response.data.settlement;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const loadSettlements = async (groupId) => {
    try {
      const response = await groupsAPI.getSettlements(groupId);
      dispatch({ type: GROUP_ACTIONS.SET_SETTLEMENTS, payload: response.data.settlements });
      return response.data.settlements;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const addFriendToGroup = async (groupId, friendData) => {
    try {
      const response = await groupsAPI.addFriendToGroup(groupId, friendData);
      // Reload the group to get updated member list
      const updatedGroup = await groupsAPI.getGroup(groupId);
      dispatch({ type: GROUP_ACTIONS.UPDATE_GROUP, payload: updatedGroup.data.group });
      return response.data.friend;
    } catch (error) {
      dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: GROUP_ACTIONS.SET_ERROR, payload: null });
  };

  const value = {
    ...state,
    // Actions
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    selectGroup,
    loadGroupExpenses,
    addGroupExpense,
    loadGroupBalances,
    loadSettlementSuggestions,
    createSettlement,
    completeSettlement,
    loadSettlements,
    addFriendToGroup,
    clearError
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};

// Custom hook to use the context
export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};

export default GroupContext;
