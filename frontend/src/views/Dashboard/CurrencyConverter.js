import React from 'react';
import { Flex } from '@chakra-ui/react';
import CurrencyConverter from '../../components/CurrencyConverter/CurrencyConverter';

const CurrencyConverterView = () => {
  return (
    <Flex flexDirection='column' pt={{ base: "80px", md: "75px" }} px={{ base: "0px", md: "0px" }}>
      <CurrencyConverter />
    </Flex>
  );
};

export default CurrencyConverterView;
