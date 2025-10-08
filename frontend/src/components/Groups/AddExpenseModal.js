import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  useColorModeValue,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  CheckboxGroup,
  Stack,
  Badge,
  Alert,
  AlertIcon,
  Box,
  Grid,
  GridItem,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import {
  AddIcon,
  MinusIcon,
  InfoIcon
} from '@chakra-ui/icons';
import { useGroup } from '../../contexts/GroupContext';
import { getSupportedCurrencies } from '../../services/currencyService';

const AddExpenseModal = ({ isOpen, onClose, group }) => {
  const { addGroupExpense, loading } = useGroup();
  // Get user info from localStorage
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ id: 'current-user' });
    }
  }, []);
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    paidBy: '',
    amount: '',
    currency: group?.defaultCurrency || 'INR',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    splitType: 'equal',
    participants: []
  });
  
  const [splitData, setSplitData] = useState([]);
  const [errors, setErrors] = useState({});
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const currencies = getSupportedCurrencies();
  const categories = [
    'Food & Dining',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Travel',
    'Utilities',
    'Healthcare',
    'Education',
    'Other'
  ];

  useEffect(() => {
    if (isOpen && group) {
      // Set current user as default payer
      const currentUserMember = group.members.find(m => 
        m.userId && m.userId.toString() === user?.id
      );
      
      if (currentUserMember) {
        setFormData(prev => ({
          ...prev,
          paidBy: `u_${user.id}`,
          participants: group.members.map(m => 
            m.userId ? `u_${m.userId}` : `f_${m.friendId}`
          )
        }));
      }
    }
  }, [isOpen, group, user]);

  useEffect(() => {
    if (formData.participants.length > 0 && formData.amount) {
      calculateSplit();
    }
  }, [formData.participants, formData.amount, formData.splitType]);

  const getMemberDisplayName = (memberId) => {
    if (!group) return memberId;
    
    const member = group.members.find(m => {
      if (memberId.startsWith('u_')) {
        const userId = memberId.replace('u_', '');
        return m.userId && m.userId.toString() === userId;
      } else if (memberId.startsWith('f_')) {
        const friendId = memberId.replace('f_', '');
        return m.friendId && m.friendId.toString() === friendId;
      }
      return false;
    });
    
    if (member) {
      if (member.userId && member.userId.toString() === user?.id) {
        return 'You';
      }
      return member.displayName;
    }
    
    return memberId;
  };

  const calculateSplit = () => {
    const amount = parseFloat(formData.amount) || 0;
    const participantCount = formData.participants.length;
    
    if (amount === 0 || participantCount === 0) {
      setSplitData([]);
      return;
    }

    let newSplitData = [];

    switch (formData.splitType) {
      case 'equal':
        const equalAmount = amount / participantCount;
        newSplitData = formData.participants.map(memberId => ({
          memberId,
          shareAmount: equalAmount,
          sharePercentage: 100 / participantCount
        }));
        break;

      case 'percentage':
        // Initialize with equal percentages if not set
        newSplitData = formData.participants.map(memberId => {
          const existing = splitData.find(s => s.memberId === memberId);
          return {
            memberId,
            shareAmount: (amount * (existing?.sharePercentage || 100 / participantCount)) / 100,
            sharePercentage: existing?.sharePercentage || 100 / participantCount
          };
        });
        break;

      case 'shares':
        // Initialize with equal shares if not set
        newSplitData = formData.participants.map(memberId => {
          const existing = splitData.find(s => s.memberId === memberId);
          const shares = existing?.shares || 1;
          return {
            memberId,
            shareAmount: 0, // Will be calculated below
            shares
          };
        });
        
        const totalShares = newSplitData.reduce((sum, s) => sum + s.shares, 0);
        newSplitData = newSplitData.map(s => ({
          ...s,
          shareAmount: (amount * s.shares) / totalShares
        }));
        break;

      case 'custom':
        // Keep existing custom amounts
        newSplitData = formData.participants.map(memberId => {
          const existing = splitData.find(s => s.memberId === memberId);
          return {
            memberId,
            shareAmount: existing?.shareAmount || 0
          };
        });
        break;

      default:
        newSplitData = [];
    }

    setSplitData(newSplitData);
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
        [field]: null
      }));
    }
  };

  const handleSplitChange = (memberId, field, value) => {
    setSplitData(prev => prev.map(split => 
      split.memberId === memberId 
        ? { ...split, [field]: parseFloat(value) || 0 }
        : split
    ));
  };

  const handleParticipantToggle = (memberId, isChecked) => {
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, memberId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        participants: prev.participants.filter(id => id !== memberId)
      }));
      
      // Remove from split data
      setSplitData(prev => prev.filter(s => s.memberId !== memberId));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.paidBy) {
      newErrors.paidBy = 'Please select who paid';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (formData.participants.length === 0) {
      newErrors.participants = 'Please select at least one participant';
    }

    // Validate split amounts
    const totalSplit = splitData.reduce((sum, s) => sum + s.shareAmount, 0);
    const amount = parseFloat(formData.amount) || 0;
    const tolerance = 0.01;

    if (Math.abs(totalSplit - amount) > tolerance) {
      newErrors.split = 'Split amounts must equal the total amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await addGroupExpense(group._id, {
        ...formData,
        amount: parseFloat(formData.amount),
        split: splitData
      });
      
      toast({
        title: 'Expense added successfully',
        description: `${formData.category} expense of ${formData.currency} ${formData.amount} has been added`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        paidBy: '',
        amount: '',
        currency: group?.defaultCurrency || 'INR',
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        splitType: 'equal',
        participants: []
      });
      setSplitData([]);
      setErrors({});
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error adding expense',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      paidBy: '',
      amount: '',
      currency: group?.defaultCurrency || 'INR',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      splitType: 'equal',
      participants: []
    });
    setSplitData([]);
    setErrors({});
    onClose();
  };

  const totalSplit = splitData.reduce((sum, s) => sum + s.shareAmount, 0);
  const amount = parseFloat(formData.amount) || 0;
  const difference = Math.abs(totalSplit - amount);

  if (!group) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={bg} maxH="90vh" overflowY="auto">
        <ModalHeader>
          <Text fontSize="xl" fontWeight="bold">
            Add Expense
          </Text>
          <Text fontSize="sm" color={textColor} fontWeight="normal">
            Add a new expense to {group.name}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Basic Info */}
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                <GridItem>
                  <FormControl isRequired isInvalid={errors.paidBy}>
                    <FormLabel>Paid By</FormLabel>
                    <Select
                      value={formData.paidBy}
                      onChange={(e) => handleInputChange('paidBy', e.target.value)}
                    >
                      <option value="">Select who paid</option>
                      {group.members.map((member) => {
                        const memberId = member.userId ? `u_${member.userId}` : `f_${member.friendId}`;
                        const displayName = member.userId && member.userId.toString() === user?.id 
                          ? 'You' 
                          : member.displayName;
                        return (
                          <option key={memberId} value={memberId}>
                            {displayName}
                          </option>
                        );
                      })}
                    </Select>
                    {errors.paidBy && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.paidBy}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired isInvalid={errors.amount}>
                    <FormLabel>Amount</FormLabel>
                    <NumberInput
                      value={formData.amount}
                      onChange={(value) => handleInputChange('amount', value)}
                      min={0}
                      precision={2}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    {errors.amount && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.amount}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                    >
                      {currencies.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired isInvalid={errors.category}>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                    {errors.category && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.category}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Notes (Optional)</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add a description for this expense..."
                  rows={3}
                />
              </FormControl>

              <Divider />

              {/* Participants */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">
                  Participants
                </Text>
                
                {errors.participants && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">{errors.participants}</Text>
                  </Alert>
                )}

                <CheckboxGroup
                  value={formData.participants}
                  onChange={(values) => setFormData(prev => ({ ...prev, participants: values }))}
                >
                  <Stack spacing={2}>
                    {group.members.map((member) => {
                      const memberId = member.userId ? `u_${member.userId}` : `f_${member.friendId}`;
                      const displayName = member.userId && member.userId.toString() === user?.id 
                        ? 'You' 
                        : member.displayName;
                      
                      return (
                        <Checkbox
                          key={memberId}
                          value={memberId}
                          isChecked={formData.participants.includes(memberId)}
                          onChange={(e) => handleParticipantToggle(memberId, e.target.checked)}
                        >
                          {displayName}
                        </Checkbox>
                      );
                    })}
                  </Stack>
                </CheckboxGroup>
              </VStack>

              <Divider />

              {/* Split Type */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">
                  How to Split
                </Text>
                
                <FormControl>
                  <FormLabel>Split Type</FormLabel>
                  <Select
                    value={formData.splitType}
                    onChange={(e) => handleInputChange('splitType', e.target.value)}
                  >
                    <option value="equal">Split Equally</option>
                    <option value="percentage">Split by Percentage</option>
                    <option value="shares">Split by Shares</option>
                    <option value="custom">Custom Amounts</option>
                  </Select>
                </FormControl>

                {/* Split Details */}
                {formData.participants.length > 0 && (
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="semibold">
                        Split Details
                      </Text>
                      {difference > 0.01 && (
                        <Tooltip label="Split amounts don't match total">
                          <Badge colorScheme="red" variant="solid">
                            Difference: {formData.currency} {difference.toFixed(2)}
                          </Badge>
                        </Tooltip>
                      )}
                    </HStack>

                    {splitData.map((split) => (
                      <HStack key={split.memberId} spacing={3}>
                        <Box flex={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {getMemberDisplayName(split.memberId)}
                          </Text>
                        </Box>
                        
                        {formData.splitType === 'percentage' && (
                          <Box w="100px">
                            <NumberInput
                              value={split.sharePercentage}
                              onChange={(value) => handleSplitChange(split.memberId, 'sharePercentage', value)}
                              min={0}
                              max={100}
                              precision={1}
                              size="sm"
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </Box>
                        )}
                        
                        {formData.splitType === 'shares' && (
                          <Box w="80px">
                            <NumberInput
                              value={split.shares}
                              onChange={(value) => handleSplitChange(split.memberId, 'shares', value)}
                              min={0}
                              precision={0}
                              size="sm"
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </Box>
                        )}
                        
                        {formData.splitType === 'custom' && (
                          <Box w="120px">
                            <NumberInput
                              value={split.shareAmount}
                              onChange={(value) => handleSplitChange(split.memberId, 'shareAmount', value)}
                              min={0}
                              precision={2}
                              size="sm"
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </Box>
                        )}
                        
                        <Box w="100px" textAlign="right">
                          <Text fontSize="sm" fontWeight="semibold">
                            {formData.currency} {split.shareAmount.toFixed(2)}
                          </Text>
                        </Box>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </VStack>

              {errors.split && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">{errors.split}</Text>
                </Alert>
              )}

              <Divider />

              {/* Submit Buttons */}
              <HStack spacing={3} justify="flex-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={loading}
                  loadingText="Adding..."
                >
                  Add Expense
                </Button>
              </HStack>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddExpenseModal;
