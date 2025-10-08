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
  Select,
  Input,
  Textarea,
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
  Badge,
  Alert,
  AlertIcon,
  Avatar,
  Box,
  Grid,
  GridItem,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import {
  AddIcon,
  CheckIcon,
  InfoIcon
} from '@chakra-ui/icons';
import { useGroup } from '../../contexts/GroupContext';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';

const SettlementModal = ({ isOpen, onClose, group, suggestions }) => {
  const { createSettlement, loading } = useGroup();
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
    fromMemberId: '',
    toMemberId: '',
    amount: '',
    currency: group?.defaultCurrency || 'INR',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [useSuggestion, setUseSuggestion] = useState(null);
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.700');

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

  const getMemberAvatar = (memberId) => {
    if (!group) return null;
    
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
    
    if (member && member.avatarUrl) {
      return member.avatarUrl;
    }
    
    const displayName = getMemberDisplayName(memberId);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
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

  const handleUseSuggestion = (suggestion) => {
    setUseSuggestion(suggestion);
    setFormData(prev => ({
      ...prev,
      fromMemberId: suggestion.fromMemberId,
      toMemberId: suggestion.toMemberId,
      amount: suggestion.amount.toString(),
      currency: suggestion.currency
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromMemberId) {
      newErrors.fromMemberId = 'Please select who is paying';
    }

    if (!formData.toMemberId) {
      newErrors.toMemberId = 'Please select who is receiving';
    }

    if (formData.fromMemberId === formData.toMemberId) {
      newErrors.toMemberId = 'Cannot pay to the same person';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
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
      await createSettlement(group._id, {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      toast({
        title: 'Settlement created successfully',
        description: `${getMemberDisplayName(formData.fromMemberId)} will pay ${getMemberDisplayName(formData.toMemberId)} ${formData.currency} ${formData.amount}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        fromMemberId: '',
        toMemberId: '',
        amount: '',
        currency: group?.defaultCurrency || 'INR',
        notes: ''
      });
      setUseSuggestion(null);
      setErrors({});
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error creating settlement',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      fromMemberId: '',
      toMemberId: '',
      amount: '',
      currency: group?.defaultCurrency || 'INR',
      notes: ''
    });
    setUseSuggestion(null);
    setErrors({});
    onClose();
  };

  if (!group) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent bg={bg} maxH="90vh" overflowY="auto">
        <ModalHeader>
          <Text fontSize="xl" fontWeight="bold">
            Settle Up
          </Text>
          <Text fontSize="sm" color={textColor} fontWeight="normal">
            Record a payment between group members
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Settlement Suggestions */}
              {suggestions && suggestions.length > 0 && (
                <VStack spacing={4} align="stretch">
                  <Text fontSize="lg" fontWeight="semibold">
                    Settlement Suggestions
                  </Text>
                  
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      These suggestions will help simplify the group's debt structure
                    </Text>
                  </Alert>

                  <VStack spacing={3} align="stretch">
                    {suggestions.map((suggestion, index) => (
                      <Card
                        key={index}
                        bg={cardBg}
                        border="1px solid"
                        borderColor={borderColor}
                        _hover={{ 
                          borderColor: 'blue.300',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleUseSuggestion(suggestion)}
                      >
                        <CardBody>
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Avatar
                                size="sm"
                                name={getMemberDisplayName(suggestion.fromMemberId)}
                                src={getMemberAvatar(suggestion.fromMemberId)}
                              />
                              <Text>should pay</Text>
                              <Avatar
                                size="sm"
                                name={getMemberDisplayName(suggestion.toMemberId)}
                                src={getMemberAvatar(suggestion.toMemberId)}
                              />
                            </HStack>
                            
                            <VStack align="end" spacing={1}>
                              <Text fontWeight="bold" color="green.600">
                                {suggestion.currency} {suggestion.amount.toFixed(2)}
                              </Text>
                              <IconButton
                                icon={<CheckIcon />}
                                size="sm"
                                colorScheme="green"
                                variant="ghost"
                                aria-label="Use this suggestion"
                              />
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>

                  <Divider />
                </VStack>
              )}

              {/* Manual Settlement Form */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">
                  Manual Settlement
                </Text>

                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                  <GridItem>
                    <FormControl isRequired isInvalid={errors.fromMemberId}>
                      <FormLabel>Who is paying?</FormLabel>
                      <Select
                        value={formData.fromMemberId}
                        onChange={(e) => handleInputChange('fromMemberId', e.target.value)}
                      >
                        <option value="">Select payer</option>
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
                      {errors.fromMemberId && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {errors.fromMemberId}
                        </Text>
                      )}
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired isInvalid={errors.toMemberId}>
                      <FormLabel>Who is receiving?</FormLabel>
                      <Select
                        value={formData.toMemberId}
                        onChange={(e) => handleInputChange('toMemberId', e.target.value)}
                      >
                        <option value="">Select receiver</option>
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
                      {errors.toMemberId && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {errors.toMemberId}
                        </Text>
                      )}
                    </FormControl>
                  </GridItem>
                </Grid>

                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
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
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                      </Select>
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any additional notes about this settlement..."
                    rows={3}
                  />
                </FormControl>
              </VStack>

              <Divider />

              {/* Submit Buttons */}
              <HStack spacing={3} justify="flex-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="green"
                  isLoading={loading}
                  loadingText="Creating..."
                >
                  Create Settlement
                </Button>
              </HStack>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SettlementModal;
