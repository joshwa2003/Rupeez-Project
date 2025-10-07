import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Input,
  NumberInput,
  NumberInputField,
  Textarea,
  VStack,
  HStack,
  useColorModeValue,
  FormErrorMessage,
  Text,
  useToast
} from '@chakra-ui/react';
import { 
  getSupportedCurrencies
} from '../../services/currencyService';

const TransactionForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    type: initialData.type || '',
    amount: initialData.amount || '',
    currency: initialData.currency || 'INR',
    category: initialData.category || '',
    date: initialData.date || new Date().toISOString().split('T')[0],
    paymentMethod: initialData.paymentMethod || '',
    notes: initialData.notes || '',
    attachment: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');

  // Load supported currencies on component mount
  useEffect(() => {
    const loadCurrencies = () => {
      const supportedCurrencies = getSupportedCurrencies();
      setCurrencies(supportedCurrencies);
    };
    loadCurrencies();
  }, []);

  const typeOptions = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' }
  ];

  const incomeCategories = [
    { value: 'Salary', label: 'Salary' },
    { value: 'Business', label: 'Business' },
    { value: 'Investment', label: 'Investment' },
    { value: 'Rental', label: 'Rental' },
    { value: 'Gift', label: 'Gift' },
    { value: 'Refund', label: 'Refund' },
    { value: 'Bonus', label: 'Bonus' },
    { value: 'Other', label: 'Other' }
  ];

  const expenseCategories = [
    { value: 'Food', label: 'Food' },
    { value: 'Rent', label: 'Rent' },
    { value: 'Utilities', label: 'Utilities' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Shopping', label: 'Shopping' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Education', label: 'Education' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Miscellaneous', label: 'Miscellaneous' },
    { value: 'Other', label: 'Other' }
  ];

  // Get categories based on selected type
  const getCategoryOptions = () => {
    if (formData.type === 'income') {
      return incomeCategories;
    } else if (formData.type === 'expense') {
      return expenseCategories;
    }
    return [];
  };

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank', label: 'Bank' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Clear category when type changes to ensure proper validation
      if (field === 'type' && prev.type !== value) {
        newData.category = '';
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload only JPG, PNG, or PDF files',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        attachment: file
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Transaction type is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data for submission
      const submissionData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        attachment: formData.attachment
      };

      // Call the onSubmit callback with the form data
      if (onSubmit) {
        await onSubmit(submissionData);
      }

      toast({
        title: 'Transaction saved',
        description: `Your transaction has been saved successfully in ${formData.currency}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save transaction. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      type: '',
      amount: '',
      currency: 'INR',
      category: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      notes: '',
      attachment: null
    });
    setErrors({});
    
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Box
      bg={bgColor}
      p={{ base: 3, md: 6, lg: 8 }}
      borderRadius={{ base: "md", md: "lg" }}
      border="1px"
      borderColor={borderColor}
      w="100%"
    >
      <form onSubmit={handleSubmit}>
        <VStack spacing={{ base: 4, md: 5, lg: 6 }} align="stretch">
          {/* Transaction Type - Full Width */}
          <FormControl isRequired isInvalid={errors.type}>
            <FormLabel 
              color={textColor} 
              fontSize={{ base: "md", md: "sm" }} 
              fontWeight={{ base: "semibold", md: "normal" }}
              mb={{ base: 2, md: 1 }}
            >
              Type
            </FormLabel>
            <Select
              placeholder="Select transaction type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              size={{ base: "lg", md: "md" }}
              h={{ base: "48px", md: "40px" }}
              fontSize={{ base: "md", md: "sm" }}
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.type}</FormErrorMessage>
          </FormControl>

          {/* Category - Full Width */}
          <FormControl isRequired isInvalid={errors.category}>
            <FormLabel 
              color={textColor} 
              fontSize={{ base: "md", md: "sm" }} 
              fontWeight={{ base: "semibold", md: "normal" }}
              mb={{ base: 2, md: 1 }}
            >
              Category
            </FormLabel>
            <Select
              placeholder={formData.type ? "Select category" : "Select transaction type first"}
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              disabled={!formData.type}
              size={{ base: "lg", md: "md" }}
              h={{ base: "48px", md: "40px" }}
              fontSize={{ base: "md", md: "sm" }}
            >
              {getCategoryOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.category}</FormErrorMessage>
          </FormControl>

          {/* Amount - Full Width */}
          <FormControl isRequired isInvalid={errors.amount}>
            <FormLabel 
              color={textColor} 
              fontSize={{ base: "md", md: "sm" }} 
              fontWeight={{ base: "semibold", md: "normal" }}
              mb={{ base: 2, md: 1 }}
            >
              Amount
            </FormLabel>
            <NumberInput
              value={formData.amount}
              onChange={(valueString) => handleInputChange('amount', valueString)}
              min={0}
              precision={2}
              size={{ base: "lg", md: "md" }}
            >
              <NumberInputField 
                placeholder="Enter amount" 
                h={{ base: "48px", md: "40px" }}
                fontSize={{ base: "md", md: "sm" }}
              />
            </NumberInput>
            <FormErrorMessage>{errors.amount}</FormErrorMessage>
          </FormControl>

          {/* Currency - Full Width */}
          <FormControl>
            <FormLabel 
              color={textColor} 
              fontSize={{ base: "md", md: "sm" }} 
              fontWeight={{ base: "semibold", md: "normal" }}
              mb={{ base: 2, md: 1 }}
            >
              Currency
            </FormLabel>
            <Select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              size={{ base: "lg", md: "md" }}
              h={{ base: "48px", md: "40px" }}
              fontSize={{ base: "md", md: "sm" }}
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.symbol}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Date - Full Width */}
          <FormControl>
            <FormLabel 
              color={textColor} 
              fontSize={{ base: "md", md: "sm" }} 
              fontWeight={{ base: "semibold", md: "normal" }}
              mb={{ base: 2, md: 1 }}
            >
              Date
            </FormLabel>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              size={{ base: "lg", md: "md" }}
              h={{ base: "48px", md: "40px" }}
              fontSize={{ base: "md", md: "sm" }}
            />
          </FormControl>

          {/* Payment Method - Full Width */}
          <FormControl>
            <FormLabel 
              color={textColor} 
              fontSize={{ base: "md", md: "sm" }} 
              fontWeight={{ base: "semibold", md: "normal" }}
              mb={{ base: 2, md: 1 }}
            >
              Payment Method
            </FormLabel>
            <Select
              placeholder="Select payment method"
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              size={{ base: "lg", md: "md" }}
              h={{ base: "48px", md: "40px" }}
              fontSize={{ base: "md", md: "sm" }}
            >
              {paymentMethodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Notes - Full Width */}
          <FormControl>
            <FormLabel 
              color={textColor}
              fontSize={{ base: "md", md: "sm" }} 
              fontWeight={{ base: "semibold", md: "normal" }}
              mb={{ base: 2, md: 1 }}
            >
              Notes
            </FormLabel>
            <Textarea
              placeholder="Add any notes (optional)"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={{ base: 3, md: 4 }}
              resize="vertical"
              size={{ base: "lg", md: "md" }}
              fontSize={{ base: "md", md: "sm" }}
            />
          </FormControl>

          {/* Attachment - Full Width */}
          <FormControl>
            <FormLabel 
              color={textColor}
              fontSize={{ base: "md", md: "sm" }} 
              fontWeight={{ base: "semibold", md: "normal" }}
              mb={{ base: 2, md: 1 }}
            >
              Attachment
            </FormLabel>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              p={1}
              size={{ base: "lg", md: "md" }}
              h={{ base: "48px", md: "40px" }}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              Upload JPG, PNG, or PDF files (max 5MB)
            </Text>
            {formData.attachment && (
              <Text fontSize="sm" color="green.500" mt={1}>
                Selected: {formData.attachment.name}
              </Text>
            )}
          </FormControl>

          {/* Action Buttons */}
          <VStack 
            spacing={{ base: 3, md: 4 }} 
            pt={{ base: 6, md: 8 }}
            w="100%"
          >
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
              loadingText="Saving..."
              size="lg"
              h={{ base: "50px", md: "56px" }}
              w="100%"
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="semibold"
              borderRadius="lg"
              _hover={{
                transform: "translateY(-1px)",
                boxShadow: "lg"
              }}
              _active={{
                transform: "translateY(0px)"
              }}
              transition="all 0.2s"
            >
              Save Transaction
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              isDisabled={isSubmitting}
              size="lg"
              h={{ base: "50px", md: "56px" }}
              w="100%"
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="semibold"
              borderRadius="lg"
              borderWidth="2px"
              _hover={{
                transform: "translateY(-1px)",
                boxShadow: "md",
                borderColor: "gray.400"
              }}
              _active={{
                transform: "translateY(0px)"
              }}
              transition="all 0.2s"
            >
              Cancel
            </Button>
          </VStack>
        </VStack>
      </form>
    </Box>
  );
};

export default TransactionForm;
