import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import RecurringTransactionsList from '../../components/RecurringTransactions/RecurringTransactionsList';

function RecurringTransactions() {
  return (
    <Flex direction="column" pt={{ base: "120px", md: "75px" }}>
      <RecurringTransactionsList />
    </Flex>
  );
}

export default RecurringTransactions;
