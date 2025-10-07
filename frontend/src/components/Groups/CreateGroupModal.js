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
  IconButton,
  Box,
  Badge,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { useGroup } from '../../contexts/GroupContext';
import { getSupportedCurrencies } from '../../services/currencyService';

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createGroup, loading } = useGroup();
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
    name: '',
    description: '',
    defaultCurrency: 'INR',
    members: []
  });
  
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const currencies = getSupportedCurrencies();

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

  const handleNewMemberChange = (field, value) => {
    setNewMember(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMember = () => {
    if (!newMember.name.trim()) {
      toast({
        title: 'Name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const member = {
      displayName: newMember.name.trim(),
      email: newMember.email.trim() || null,
      phone: newMember.phone.trim() || null
    };

    setFormData(prev => ({
      ...prev,
      members: [...prev.members, member]
    }));

    setNewMember({
      name: '',
      email: '',
      phone: ''
    });
  };

  const removeMember = (index) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    if (formData.name.length > 50) {
      newErrors.name = 'Group name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
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
      await createGroup(formData);
      
      toast({
        title: 'Group created successfully',
        description: `${formData.name} has been created with ${formData.members.length + 1} members`,
        status: 'success',
        duration: 5001,
        isClosable: true,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        defaultCurrency: 'INR',
        members: []
      });
      setNewMember({
        name: '',
        email: '',
        phone: ''
      });
      setErrors({});
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error creating group',
        description: error.message,
        status: 'error',
        duration: 5001,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      defaultCurrency: 'INR',
      members: []
    });
    setNewMember({
      name: '',
      email: '',
      phone: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent bg={bg} maxH="90vh" overflowY="auto">
        <ModalHeader>
          <Text fontSize="xl" fontWeight="bold">
            Create New Group
          </Text>
          <Text fontSize="sm" color={textColor} fontWeight="normal">
            Set up a group to start splitting expenses with friends
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Group Details */}
              <VStack spacing={4} align="stretch">
                <FormControl isRequired isInvalid={errors.name}>
                  <FormLabel>Group Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Weekend Trip, Office Lunch, etc."
                    maxLength={50}
                  />
                  {errors.name && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.name}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={errors.description}>
                  <FormLabel>Description (Optional)</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the group..."
                    maxLength={200}
                    rows={3}
                  />
                  {errors.description && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.description}
                    </Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Default Currency</FormLabel>
                  <Select
                    value={formData.defaultCurrency}
                    onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>

              <Divider />

              {/* Add Members */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">
                  Add Members
                </Text>
                
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    You will be automatically added as the group owner. Add friends below.
                  </Text>
                </Alert>

                <VStack spacing={3} align="stretch">
                  <HStack spacing={2}>
                    <FormControl flex={1}>
                      <Input
                        value={newMember.name}
                        onChange={(e) => handleNewMemberChange('name', e.target.value)}
                        placeholder="Friend's name"
                        size="sm"
                      />
                    </FormControl>
                    <FormControl flex={1}>
                      <Input
                        value={newMember.email}
                        onChange={(e) => handleNewMemberChange('email', e.target.value)}
                        placeholder="Email (optional)"
                        type="email"
                        size="sm"
                      />
                    </FormControl>
                    <FormControl flex={1}>
                      <Input
                        value={newMember.phone}
                        onChange={(e) => handleNewMemberChange('phone', e.target.value)}
                        placeholder="Phone (optional)"
                        size="sm"
                      />
                    </FormControl>
                    <IconButton
                      icon={<AddIcon />}
                      onClick={addMember}
                      colorScheme="blue"
                      size="sm"
                      aria-label="Add member"
                    />
                  </HStack>
                </VStack>

                {/* Members List */}
                {formData.members.length > 0 && (
                  <VStack spacing={2} align="stretch">
                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                      Added Members ({formData.members.length})
                    </Text>
                    {formData.members.map((member, index) => (
                      <HStack
                        key={index}
                        p={3}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="md"
                        justify="space-between"
                      >
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="medium">{member.displayName}</Text>
                          <HStack spacing={2}>
                            {member.email && (
                              <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                                {member.email}
                              </Badge>
                            )}
                            {member.phone && (
                              <Badge colorScheme="green" variant="subtle" fontSize="xs">
                                {member.phone}
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                        <IconButton
                          icon={<CloseIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeMember(index)}
                          aria-label="Remove member"
                        />
                      </HStack>
                    ))}
                  </VStack>
                )}
              </VStack>

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
                  loadingText="Creating..."
                >
                  Create Group
                </Button>
              </HStack>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CreateGroupModal;
