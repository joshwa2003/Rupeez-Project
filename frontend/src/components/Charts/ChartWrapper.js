import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

const ChartWrapper = ({ children, height = 300, fallbackText = "No data available" }) => {
  const textColor = useColorModeValue('#1A202C', '#FFFFFF');

  return (
    <Box height={height} position="relative">
      {children}
    </Box>
  );
};

export default ChartWrapper;
