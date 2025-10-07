import React, { useState, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  HStack,
  FormErrorMessage,
  useColorModeValue
} from '@chakra-ui/react';

const CategoryForm = ({ initialData = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Color mode values
  const textColor = useColorModeValue('gray.700', 'white');

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'expense'
      });
    } else {
      setFormData({
        name: '',
        type: 'expense'
      });
    }
    setErrors({});
  }, [initialData]);

  // Handle input changes
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validate category name
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
    }

    // Validate type
    if (!formData.type || !['income', 'expense'].includes(formData.type)) {
      newErrors.type = 'Please select a valid category type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const submissionData = {
        name: formData.name.trim(),
        type: formData.type
      };

      // Call the onSubmit callback
      if (onSubmit) {
        await onSubmit(submissionData);
      }

      // Reset form if creating new category
      if (!initialData) {
        setFormData({
          name: '',
          type: 'expense'
        });
      }

    } catch (error) {
      console.error('Error submitting category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      type: 'expense'
    });
    setErrors({});
    
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        {/* Category Name */}
        <FormControl isRequired isInvalid={errors.name}>
          <FormLabel color={textColor}>Category Name</FormLabel>
          <Input
            placeholder="Enter category name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            maxLength={50}
          />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>

        {/* Category Type */}
        <FormControl isRequired isInvalid={errors.type}>
          <FormLabel color={textColor}>Category Type</FormLabel>
          <Select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          <FormErrorMessage>{errors.type}</FormErrorMessage>
        </FormControl>

        {/* Action Buttons */}
        <HStack spacing={3} pt={4}>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting}
            loadingText={initialData ? "Updating..." : "Creating..."}
            flex={1}
          >
            {initialData ? 'Update Category' : 'Create Category'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            flex={1}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

export default CategoryForm;
