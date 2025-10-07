import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import BudgetManager from 'components/Budgets/BudgetManager';
import SetBudgetForm from 'components/Budgets/SetBudgetForm';
import { budgetsAPI } from 'services/api';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const buttonBg = useColorModeValue("blue.500", "blue.400");
  const buttonHoverBg = useColorModeValue("blue.600", "blue.500");

  // Load budgets and alerts on component mount
  useEffect(() => {
    loadBudgetsAndAlerts();
  }, []);

  const loadBudgetsAndAlerts = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [budgetsResponse, alertsResponse] = await Promise.all([
        budgetsAPI.getAll(),
        budgetsAPI.getAlerts()
      ]);

      if (budgetsResponse.status === 'success') {
        setBudgets(budgetsResponse.data.budgets);
      }

      if (alertsResponse.status === 'success') {
        setAlerts(alertsResponse.data.alerts);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      setError('Failed to load budgets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBudget = async (budgetData) => {
    try {
      const response = await budgetsAPI.create(budgetData);
      if (response.status === 'success') {
        toast({
          title: "Budget Created!",
          description: `Budget for ${budgetData.category} has been set successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onClose();
        loadBudgetsAndAlerts(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: "Creation Failed",
        description: error.message || 'Failed to create budget',
        status: "error",
        duration: 5001,
        isClosable: true,
      });
    }
  };

  const handleBudgetUpdate = () => {
    loadBudgetsAndAlerts(); // Refresh data after update/delete
  };

  return (
    <Flex direction='column' pt={{ base: "120px", md: "75px" }}>
      {/* Page Header with Add Budget Button */}
      <Flex justify="space-between" align="center" w="100%" mb={6}>
        <Box textAlign="center" flex="1">
          <Heading size="xl" mb={2}>
            Budget Alerts
          </Heading>
          <Text color="gray.500" fontSize="lg">
            Set spending limits and monitor your expenses by category
          </Text>
        </Box>

        {/* Add New Budget Button - Top Right */}
        <Box>
          <Button
            leftIcon={<AddIcon />}
            bg={buttonBg}
            color="white"
            size="lg"
            onClick={onOpen}
            _hover={{
              bg: buttonHoverBg,
              transform: "translateY(-1px)",
              boxShadow: "lg"
            }}
            _active={{
              transform: "translateY(0px)"
            }}
            transition="all 0.2s"
            borderRadius="lg"
            fontWeight="semibold"
            px={6}
            py={3}
            h="auto"
          >
            Set New Budget
          </Button>
        </Box>
      </Flex>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Box mb={6}>
          {alerts.map((alert, index) => (
            <Alert status={alert.alertType === 'exceeded' ? 'error' : 'warning'} mb={2} key={index}>
              <AlertIcon />
              <AlertDescription>
                {alert.alertType === 'exceeded'
                  ? `⚠️ You have exceeded your ${alert.category} budget! Spent ₹${alert.spentAmount} of ₹${alert.limitAmount}.`
                  : `⚠️ You have spent ${alert.percentageUsed.toFixed(1)}% of your ${alert.category} budget (₹${alert.spentAmount} of ₹${alert.limitAmount}).`
                }
              </AlertDescription>
            </Alert>
          ))}
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert status='error' mb='24px' borderRadius='md'>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Budget Manager Component */}
      <BudgetManager
        budgets={budgets}
        isLoading={isLoading}
        onBudgetUpdate={handleBudgetUpdate}
      />

      {/* Set Budget Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set New Budget</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SetBudgetForm onSubmit={handleCreateBudget} />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Budgets;
