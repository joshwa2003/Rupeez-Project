import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Flex,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { useHistory } from 'react-router-dom';
import { AddIcon } from '@chakra-ui/icons';
import CategoryManager from 'components/Categories/CategoryManager';

const Categories = () => {
  const history = useHistory();
  const buttonBg = useColorModeValue("blue.500", "blue.400");
  const buttonHoverBg = useColorModeValue("blue.600", "blue.500");

  const handleAddTransaction = () => {
    history.push('/admin/add-transaction');
  };

  return (
    <Flex direction='column' pt={{ base: "120px", md: "75px" }}>
      {/* Page Header with Add Transaction Button */}
      <Flex justify="space-between" align="center" w="100%" mb={6}>
        <Box textAlign="center" flex="1">
          <Heading size="xl" mb={2}>
            Expense Categories
          </Heading>
          <Text color="gray.500" fontSize="lg">
            Manage your income and expense categories
          </Text>
        </Box>
        
        {/* Add New Transaction Button - Top Right */}
        <Box>
          <Button
            leftIcon={<AddIcon />}
            bg={buttonBg}
            color="white"
            size="lg"
            onClick={handleAddTransaction}
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
            Add New Transaction
          </Button>
        </Box>
      </Flex>

      {/* Category Manager Component */}
      <CategoryManager />
    </Flex>
  );
};

export default Categories;
