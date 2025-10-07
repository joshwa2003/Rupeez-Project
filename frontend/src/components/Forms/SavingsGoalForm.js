import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  useToast,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';

const SavingsGoalForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    targetAmount: initialData.targetAmount || '',
    deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
    category: initialData.category || 'other'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const categories = [
    { value: 'emergency', label: 'Emergency Fund' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'house', label: 'House/Property' },
    { value: 'car', label: 'Car/Vehicle' },
    { value: 'education', label: 'Education' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'other', label: 'Other' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than 0';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        targetAmount: parseFloat(formData.targetAmount)
      });

      toast({
        title: 'Success',
        description: initialData.title ? 'Savings goal updated successfully' : 'Savings goal created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form if creating new goal
      if (!initialData.title) {
        setFormData({
          title: '',
          description: '',
          targetAmount: '',
          deadline: '',
          category: 'other'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save savings goal',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isInvalid={errors.title}>
          <FormLabel>Goal Title</FormLabel>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Emergency Fund, Vacation to Europe"
            maxLength={100}
          />
          <FormErrorMessage>{errors.title}</FormErrorMessage>
        </FormControl>

        <FormControl>
          <FormLabel>Description (Optional)</FormLabel>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your savings goal..."
            maxLength={500}
            rows={3}
          />
        </FormControl>

        <FormControl isInvalid={errors.targetAmount}>
          <FormLabel>Target Amount ($)</FormLabel>
          <NumberInput
            value={formData.targetAmount}
            onChange={(valueString) => handleInputChange('targetAmount', valueString)}
            min={0}
            precision={2}
          >
            <NumberInputField placeholder="0.00" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>{errors.targetAmount}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={errors.deadline}>
          <FormLabel>Target Date</FormLabel>
          <Input
            type="date"
            value={formData.deadline}
            onChange={(e) => handleInputChange('deadline', e.target.value)}
          />
          <FormErrorMessage>{errors.deadline}</FormErrorMessage>
        </FormControl>

        <FormControl>
          <FormLabel>Category</FormLabel>
          <Select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>
        </FormControl>

        <HStack spacing={4} pt={4}>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting}
            loadingText="Saving..."
            flex={1}
          >
            {initialData.title ? 'Update Goal' : 'Create Goal'}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              isDisabled={isSubmitting}
              flex={1}
            >
              Cancel
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default SavingsGoalForm;
