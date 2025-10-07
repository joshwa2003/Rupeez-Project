import React from 'react';
import {
  Flex,
  Text,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { useHistory } from 'react-router-dom';
// Custom components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import TransactionForm from 'components/Forms/TransactionForm';
import { useTransactions } from 'contexts/TransactionContext';

const AddTransaction = () => {
  const { addTransaction } = useTransactions();
  const toast = useToast();
  const history = useHistory();
  const textColor = useColorModeValue("gray.700", "white");

  const handleFormSubmit = async (formData) => {
    try {
      // Add transaction to context
      const newTransaction = await addTransaction(formData);
      
      console.log('Transaction Added:', newTransaction);
      
      // Show success message
      toast({
        title: 'Transaction Added',
        description: `${formData.type === 'income' ? 'Income' : 'Expense'} of ${formData.currency || 'USD'} ${formData.amount} has been added successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect to Categories page after successful submission
      setTimeout(() => {
        history.push('/admin/categories');
      }, 1500); // Small delay to show the success message
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFormCancel = () => {
    // Navigate back to Categories page when cancelled
    history.push('/admin/categories');
  };

  return (
    <Flex direction="column" pt={{ base: "120px", md: "75px" }}>
      <Flex 
        justify="center" 
        px={{ base: 4, md: 6, lg: 8 }}
        w="100%"
      >
        <Card 
          w="100%" 
          maxW={{ base: "100%", md: "100%", lg: "1200px", xl: "100%" }}
          minH="auto"
        >
          <CardHeader p={{ base: "16px 0px 20px 0px", md: "20px 0px 24px 0px" }}>
            <Text 
              fontSize={{ base: "lg", md: "xl", lg: "2xl" }} 
              color={textColor} 
              fontWeight="bold" 
              textAlign="center"
            >
              Add New Transaction
            </Text>
            <Text 
              fontSize={{ base: "xs", md: "sm" }} 
              color="gray.500" 
              textAlign="center" 
              mt={2}
            >
              Enter transaction details to track your income and expenses
            </Text>
          </CardHeader>
          <CardBody p={{ base: 4, md: 6, lg: 8 }}>
            <TransactionForm
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </CardBody>
        </Card>
      </Flex>
    </Flex>
  );
};

export default AddTransaction;
