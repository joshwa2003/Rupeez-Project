import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  useToast,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text
} from '@chakra-ui/react';
import { recurringTransactionService } from '../../services/recurringTransactionService';

const RecurringTransactionModal = ({ isOpen, onClose, recurring }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    currency: 'USD',
    category: '',
    paymentMethod: 'cash',
    notes: '',
    frequency: 'monthly',
    interval: 1,
    dayOfMonth: '',
    dayOfWeek: '',
    startDate: '',
    endDate: '',
    autoApprove: true,
    notifyUser: true,
    notificationMethod: 'in-app'
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (recurring) {
      setFormData({
        type: recurring.type,
        amount: recurring.amount,
        currency: recurring.currency,
        category: recurring.category,
        paymentMethod: recurring.paymentMethod,
        notes: recurring.notes || '',
        frequency: recurring.frequency,
        interval: recurring.interval,
        dayOfMonth: recurring.dayOfMonth || '',
        dayOfWeek: recurring.dayOfWeek !== null ? recurring.dayOfWeek : '',
        startDate: recurring.startDate ? new Date(recurring.startDate).toISOString().split('T')[0] : '',
        endDate: recurring.endDate ? new Date(recurring.endDate).toISOString().split('T')[0] : '',
        autoApprove: recurring.autoApprove,
        notifyUser: recurring.notifyUser,
        notificationMethod: recurring.notificationMethod
      });
    } else {
      // Reset form for new transaction
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        type: 'expense',
        amount: '',
        currency: 'USD',
        category: '',
        paymentMethod: 'cash',
        notes: '',
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: '',
        dayOfWeek: '',
        startDate: today,
        endDate: '',
        autoApprove: true,
        notifyUser: true,
        notificationMethod: 'in-app'
      });
    }
  }, [recurring, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || !formData.category || !formData.startDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        interval: parseInt(formData.interval),
        dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : null,
        dayOfWeek: formData.dayOfWeek !== '' ? parseInt(formData.dayOfWeek) : null
      };

      if (recurring) {
        await recurringTransactionService.update(recurring._id, submitData);
        toast({
          title: 'Success',
          description: 'Recurring transaction updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        await recurringTransactionService.create(submitData);
        toast({
          title: 'Success',
          description: 'Recurring transaction created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save recurring transaction',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Salary',
    'Rent',
    'Utilities',
    'Groceries',
    'Transportation',
    'Insurance',
    'Subscription',
    'Entertainment',
    'Healthcare',
    'Education',
    'Investment',
    'Other'
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {recurring ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
        </ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              {/* Type */}
              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  isDisabled={!!recurring}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </Select>
              </FormControl>

              {/* Amount and Currency */}
              <HStack width="100%" spacing={4}>
                <FormControl isRequired flex={2}>
                  <FormLabel>Amount</FormLabel>
                  <NumberInput
                    value={formData.amount}
                    onChange={(value) => handleNumberChange('amount', value)}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField name="amount" placeholder="0.00" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl flex={1}>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                    <option value="JPY">JPY</option>
                  </Select>
                </FormControl>
              </HStack>

              {/* Category */}
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Select category"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FormControl>

              {/* Payment Method */}
              <FormControl>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                </Select>
              </FormControl>

              {/* Frequency */}
              <FormControl isRequired>
                <FormLabel>Frequency</FormLabel>
                <Select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  isDisabled={!!recurring}
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </Select>
              </FormControl>

              {/* Day of Month (for monthly) */}
              {formData.frequency === 'monthly' && (
                <FormControl>
                  <FormLabel>Day of Month (optional)</FormLabel>
                  <NumberInput
                    value={formData.dayOfMonth}
                    onChange={(value) => handleNumberChange('dayOfMonth', value)}
                    min={1}
                    max={31}
                  >
                    <NumberInputField placeholder="Leave empty for current day" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Enter -1 for last day of month
                  </Text>
                </FormControl>
              )}

              {/* Day of Week (for weekly) */}
              {formData.frequency === 'weekly' && (
                <FormControl>
                  <FormLabel>Day of Week (optional)</FormLabel>
                  <Select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleChange}
                    placeholder="Leave empty for current day"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Start Date */}
              <FormControl isRequired>
                <FormLabel>Start Date</FormLabel>
                <Input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  isDisabled={!!recurring}
                />
              </FormControl>

              {/* End Date */}
              <FormControl>
                <FormLabel>End Date (optional)</FormLabel>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Leave empty for no end date
                </Text>
              </FormControl>

              {/* Notes */}
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any notes..."
                  rows={3}
                />
              </FormControl>

              {/* Auto Approve */}
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Auto-approve transactions</FormLabel>
                <Switch
                  isChecked={formData.autoApprove}
                  onChange={() => handleSwitchChange('autoApprove')}
                />
              </FormControl>

              {/* Notify User */}
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Send notifications</FormLabel>
                <Switch
                  isChecked={formData.notifyUser}
                  onChange={() => handleSwitchChange('notifyUser')}
                />
              </FormControl>

              {/* Notification Method */}
              {formData.notifyUser && (
                <FormControl>
                  <FormLabel>Notification Method</FormLabel>
                  <Select
                    name="notificationMethod"
                    value={formData.notificationMethod}
                    onChange={handleChange}
                  >
                    <option value="in-app">In-App</option>
                    <option value="email">Email</option>
                    <option value="both">Both</option>
                  </Select>
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={loading}
            >
              {recurring ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default RecurringTransactionModal;
