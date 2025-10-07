import React from 'react';
import { Flex } from '@chakra-ui/react';
import ExpenseCalendar from '../../components/Calendar/ExpenseCalendar';

const ExpenseCalendarView = () => {
  return (
    <Flex flexDirection='column' pt={{ base: "80px", md: "75px" }} px={{ base: "0px", md: "0px" }}>
      <ExpenseCalendar />
    </Flex>
  );
};

export default ExpenseCalendarView;
