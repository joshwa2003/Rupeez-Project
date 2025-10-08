import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Button,
  Progress,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ChevronDownIcon } from '@chakra-ui/icons';
import Card from 'components/Card/Card';
import CardBody from 'components/Card/CardBody';
import CardHeader from 'components/Card/CardHeader';
import SetBudgetForm from './SetBudgetForm';
import { budgetsAPI } from 'services/api';

const BudgetManager = ({ budgets, isLoading, onBudgetUpdate }) => {
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();

  const textColor = useColorModeValue("gray.700", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.800");

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'red';
    if (percentage >= 80) return 'orange';
    if (percentage >= 50) return 'yellow';
    return 'green';
  };

  const getStatusBadge = (percentage) => {
    if (percentage >= 100) return { color: 'red', text: 'Exceeded' };
    if (percentage >= 80) return { color: 'orange', text: 'Warning' };
    return { color: 'green', text: 'On Track' };
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    onEditOpen();
  };

  const handleDeleteBudget = (budgetId) => {
    setDeleteBudgetId(budgetId);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    try {
      const response = await budgetsAPI.delete(deleteBudgetId);
      if (response.status === 'success') {
        toast({
          title: "Budget Deleted",
          description: "Budget has been deleted successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onBudgetUpdate();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete budget. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setDeleteBudgetId(null);
    }
  };

  const handleUpdateBudget = async (budgetData) => {
    try {
      const response = await budgetsAPI.update(editingBudget._id, budgetData);
      if (response.status === 'success') {
        toast({
          title: "Budget Updated",
          description: "Budget has been updated successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onEditClose();
        setEditingBudget(null);
        onBudgetUpdate();
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update budget. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <Text textAlign="center">Loading budgets...</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
        <CardHeader p="6px 0px 22px 0px">
          <Flex justify="space-between" align="center">
            <Text fontSize="xl" color={textColor} fontWeight="bold">
              Your Budgets
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {budgets.length}
            </Text>
          </Flex>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Active Budget Limits
          </Text>
        </CardHeader>
        <CardBody>
          {budgets.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500" mb={4}>
                No budgets set yet. Create your first budget to start monitoring expenses!
              </Text>
            </Box>
          ) : (
            <Table variant="simple" color={textColor}>
              <Thead>
                <Tr my=".8rem" pl="0px" color="gray.400">
                  <Th pl="0px" borderColor={borderColor} color="gray.400">
                    Category
                  </Th>
                  <Th borderColor={borderColor} color="gray.400">Period</Th>
                  <Th borderColor={borderColor} color="gray.400">Limit</Th>
                  <Th borderColor={borderColor} color="gray.400">Spent</Th>
                  <Th borderColor={borderColor} color="gray.400">Remaining</Th>
                  <Th borderColor={borderColor} color="gray.400">Progress</Th>
                  <Th borderColor={borderColor} color="gray.400">Status</Th>
                  <Th borderColor={borderColor} color="gray.400">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {budgets.map((budget) => {
                  const percentage = budget.percentageUsed || 0;
                  const status = getStatusBadge(percentage);

                  return (
                    <Tr key={budget._id}>
                      <Td pl="0px" borderColor={borderColor}>
                        <Text fontWeight="bold">{budget.category}</Text>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Text textTransform="capitalize">{budget.period}</Text>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Text fontWeight="semibold">₹{budget.limitAmount?.toLocaleString()}</Text>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Text>₹{budget.spentAmount?.toLocaleString()}</Text>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Text color={budget.remainingAmount >= 0 ? 'green.500' : 'red.500'}>
                          ₹{budget.remainingAmount?.toLocaleString()}
                        </Text>
                      </Td>
                      <Td borderColor={borderColor} minW="150px">
                        <Box>
                          <Progress
                            value={Math.min(percentage, 100)}
                            colorScheme={getProgressColor(percentage)}
                            size="sm"
                            mb={1}
                          />
                          <Text fontSize="xs" color="gray.500">
                            {percentage.toFixed(1)}%
                          </Text>
                        </Box>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Badge colorScheme={status.color}>
                          {status.text}
                        </Badge>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<ChevronDownIcon />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem icon={<EditIcon />} onClick={() => handleEditBudget(budget)}>
                              Edit Budget
                            </MenuItem>
                            <MenuItem
                              icon={<DeleteIcon />}
                              onClick={() => handleDeleteBudget(budget._id)}
                              color="red.500"
                            >
                              Delete Budget
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Edit Budget Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Budget</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SetBudgetForm
              initialData={editingBudget}
              onSubmit={handleUpdateBudget}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose} leastDestructiveRef={undefined}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Budget
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default BudgetManager;
