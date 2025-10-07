import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  VStack,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { transactionsAPI } from 'services/api';

const SetBudgetForm = ({ onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    category: initialData?.category || '',
    limitAmount: initialData?.limitAmount || '',
    period: initialData?.period || 'monthly',
    alertThresholds: initialData?.alertThresholds || { warning: 80, exceeded: 100 }
  });
  const [categories, setCategories] = useState(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other', 'Groceries', 'Dining', 'Fuel', 'Utilities', 'Insurance', 'Entertainment', 'Travel', 'Personal Care', 'Subscriptions', 'Miscellaneous']);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Load available categories from transactions
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await transactionsAPI.getAll();
      if (response.status === 'success' && response.data.transactions && response.data.transactions.length > 0) {
        // Extract unique categories from expense transactions
        const expenseCategories = response.data.transactions
          .filter(transaction => transaction.type === 'expense')
          .map(transaction => transaction.category)
          .filter((category, index, arr) => arr.indexOf(category) === index) // Remove duplicates
          .filter(category => category && category.trim() !== '') // Remove empty categories
          .sort();

        // If we have expense categories, use them, otherwise use fallback
        if (expenseCategories.length > 0) {
          // Combine with common categories to ensure all options are available
          const allCategories = [...new Set([...expenseCategories, ...categories])].sort();
          setCategories(allCategories);
        } else {
          // No expense transactions found, use comprehensive categories
          setCategories(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other', 'Groceries', 'Dining', 'Fuel', 'Utilities', 'Insurance', 'Travel', 'Personal Care', 'Subscriptions', 'Miscellaneous']);
        }
      } else {
        // No transactions or API response issue, use comprehensive categories
        setCategories(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other', 'Groceries', 'Dining', 'Fuel', 'Utilities', 'Insurance', 'Travel', 'Personal Care', 'Subscriptions', 'Miscellaneous']);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to comprehensive categories
      setCategories(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other', 'Groceries', 'Dining', 'Fuel', 'Utilities', 'Insurance', 'Travel', 'Personal Care', 'Subscriptions', 'Miscellaneous']);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThresholdChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      alertThresholds: {
        ...prev.alertThresholds,
        [type]: parseInt(value)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select a category",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.limitAmount || formData.limitAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid budget limit",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.alertThresholds.warning >= formData.alertThresholds.exceeded) {
      toast({
        title: "Validation Error",
        description: "Warning threshold must be less than exceeded threshold",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ...formData,
        limitAmount: parseFloat(formData.limitAmount)
      });
    } catch (error) {
      console.error('Error submitting budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select
            placeholder="Select a category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Choose from your expense categories or add a new one
          </Text>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Budget Period</FormLabel>
          <Select
            value={formData.period}
            onChange={(e) => handleInputChange('period', e.target.value)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Budget Limit (₹)</FormLabel>
          <NumberInput
            min={1}
            value={formData.limitAmount}
            onChange={(valueString) => handleInputChange('limitAmount', valueString)}
          >
            <NumberInputField placeholder="Enter budget limit" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>Warning Threshold (%)</FormLabel>
          <NumberInput
            min={1}
            max={99}
            value={formData.alertThresholds.warning}
            onChange={(valueString) => handleThresholdChange('warning', valueString)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Get notified when you reach this percentage of your budget
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Exceeded Threshold (%)</FormLabel>
          <NumberInput
            min={1}
            max={100}
            value={formData.alertThresholds.exceeded}
            onChange={(valueString) => handleThresholdChange('exceeded', valueString)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Get alerted when you exceed this percentage of your budget
          </Text>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          width="full"
          isLoading={isLoading}
          loadingText="Creating Budget..."
        >
          {initialData ? 'Update Budget' : 'Create Budget'}
        </Button>
      </VStack>
    </Box>
  );
};

export default SetBudgetForm;
