// Chakra imports
import {
  Box,
  Button,
  Flex,
  Grid,
  Text,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Progress,
  Badge,
  VStack,
  HStack,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
// Custom components
import Card from "components/Card/Card.js";
import SavingsGoalForm from "components/Forms/SavingsGoalForm.js";
import React, { useState, useRef } from "react";
// Context
import { useSavingsGoals } from "contexts/SavingsGoalContext";
// Icons
import { AddIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";

export default function SavingsGoals() {
  // Chakra Color Mode
  const textColor = useColorModeValue("gray.700", "white");
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  // Modal controls
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isAddSavingsOpen, onOpen: onAddSavingsOpen, onClose: onAddSavingsClose } = useDisclosure();
  
  // State
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [addingSavingsGoal, setAddingSavingsGoal] = useState(null);
  const [savingsAmount, setSavingsAmount] = useState('');
  const cancelRef = useRef();
  const toast = useToast();
  
  // Context
  const {
    savingsGoals,
    loading,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addSavings
  } = useSavingsGoals();

  // Handlers
  const handleCreateGoal = () => {
    setEditingGoal(null);
    onFormOpen();
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    onFormOpen();
  };

  const handleDeleteGoal = (goal) => {
    setDeletingGoal(goal);
    onDeleteOpen();
  };

  const handleAddSavings = (goal) => {
    setAddingSavingsGoal(goal);
    setSavingsAmount('');
    onAddSavingsOpen();
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal._id || editingGoal.id, formData);
      } else {
        await addSavingsGoal(formData);
      }
      onFormClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteSavingsGoal(deletingGoal._id || deletingGoal.id);
      toast({
        title: 'Success',
        description: 'Savings goal deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete savings goal',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const confirmAddSavings = async () => {
    try {
      const amount = parseFloat(savingsAmount);
      if (amount <= 0) {
        toast({
          title: 'Error',
          description: 'Amount must be greater than 0',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await addSavings(addingSavingsGoal._id || addingSavingsGoal.id, amount);
      toast({
        title: 'Success',
        description: `$${amount.toFixed(2)} added to your savings goal!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onAddSavingsClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add savings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Helper functions
  const getProgressPercentage = (goal) => {
    return goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  };

  const getDaysRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'active': return 'blue';
      case 'paused': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      'emergency': 'Emergency Fund',
      'vacation': 'Vacation',
      'house': 'House/Property',
      'car': 'Car/Vehicle',
      'education': 'Education',
      'retirement': 'Retirement',
      'other': 'Other'
    };
    return categories[category] || 'Other';
  };

  return (
    <Flex flexDirection='column' pt={{ base: "120px", md: "75px" }}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb="20px">
        <Text color={textColor} fontSize="2xl" fontWeight="bold">
          Savings Goals
        </Text>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleCreateGoal}
        >
          New Goal
        </Button>
      </Flex>

      {/* Goals Grid */}
      {loading ? (
        <Text>Loading...</Text>
      ) : savingsGoals.length === 0 ? (
        <Card p="40px" textAlign="center">
          <Text color="gray.500" fontSize="lg" mb="4">
            No savings goals yet
          </Text>
          <Text color="gray.400" mb="6">
            Create your first savings goal to start tracking your progress
          </Text>
          <Button colorScheme="blue" onClick={handleCreateGoal}>
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
          gap="20px"
        >
          {savingsGoals.map((goal) => {
            const progressPercentage = getProgressPercentage(goal);
            const daysRemaining = getDaysRemaining(goal.deadline);
            
            return (
              <Card key={goal._id || goal.id} p="20px">
                <VStack align="stretch" spacing="4">
                  {/* Header */}
                  <Flex justify="space-between" align="flex-start">
                    <VStack align="flex-start" spacing="1" flex="1">
                      <Text fontWeight="bold" fontSize="lg" color={textColor}>
                        {goal.title}
                      </Text>
                      <Badge colorScheme={getStatusColor(goal.status)}>
                        {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                      </Badge>
                      <Text fontSize="sm" color="gray.500">
                        {getCategoryLabel(goal.category)}
                      </Text>
                    </VStack>
                    <HStack>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditGoal(goal)}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteGoal(goal)}
                      />
                    </HStack>
                  </Flex>

                  {/* Description */}
                  {goal.description && (
                    <Text fontSize="sm" color="gray.600">
                      {goal.description}
                    </Text>
                  )}

                  {/* Progress */}
                  <Box>
                    <Flex justify="space-between" mb="2">
                      <Text fontSize="sm" color="gray.600">
                        Progress
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color={textColor}>
                        {progressPercentage.toFixed(1)}%
                      </Text>
                    </Flex>
                    <Progress
                      value={progressPercentage}
                      colorScheme={goal.status === 'completed' ? 'green' : 'blue'}
                      size="lg"
                      borderRadius="md"
                    />
                  </Box>

                  {/* Amount */}
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      Saved
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>
                      ${goal.currentAmount?.toFixed(2) || '0.00'} / ${goal.targetAmount.toFixed(2)}
                    </Text>
                  </Flex>

                  {/* Deadline */}
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      Deadline
                    </Text>
                    <Text fontSize="sm" color={daysRemaining < 30 ? 'red.500' : 'gray.600'}>
                      {daysRemaining} days left
                    </Text>
                  </Flex>

                  {/* Monthly Target */}
                  {goal.monthlyTarget && (
                    <Flex justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Monthly Target
                      </Text>
                      <Text fontSize="sm" color="blue.500" fontWeight="bold">
                        ${goal.monthlyTarget.toFixed(2)}
                      </Text>
                    </Flex>
                  )}

                  {/* Actions */}
                  {goal.status === 'active' && (
                    <Button
                      colorScheme="green"
                      size="sm"
                      onClick={() => handleAddSavings(goal)}
                    >
                      Add Savings
                    </Button>
                  )}
                </VStack>
              </Card>
            );
          })}
        </Grid>
      )}

      {/* Create/Edit Goal Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SavingsGoalForm
              onSubmit={handleFormSubmit}
              onCancel={onFormClose}
              initialData={editingGoal || {}}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Savings Goal
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{deletingGoal?.title}"? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Add Savings Modal */}
      <Modal isOpen={isAddSavingsOpen} onClose={onAddSavingsClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Savings</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text>
                Add money to "{addingSavingsGoal?.title}"
              </Text>
              <NumberInput
                value={savingsAmount}
                onChange={(valueString) => setSavingsAmount(valueString)}
                min={0}
                precision={2}
                w="100%"
              >
                <NumberInputField placeholder="0.00" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <HStack spacing={4} w="100%">
                <Button
                  colorScheme="green"
                  onClick={confirmAddSavings}
                  flex={1}
                  isDisabled={!savingsAmount || parseFloat(savingsAmount) <= 0}
                >
                  Add Savings
                </Button>
                <Button variant="outline" onClick={onAddSavingsClose} flex={1}>
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
