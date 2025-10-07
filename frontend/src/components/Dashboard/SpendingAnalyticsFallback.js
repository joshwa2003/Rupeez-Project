import React from 'react';
import { 
  Box, 
  Center, 
  VStack, 
  Text, 
  useColorModeValue,
  Heading
} from '@chakra-ui/react';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';

const SpendingAnalyticsFallback = () => {
  const textColor = useColorModeValue('gray.700', 'white');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box>
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} mb={6}>
        <CardHeader>
          <Heading size="md" color={textColor}>Spending Analytics</Heading>
        </CardHeader>
        <CardBody>
          <Center py={10}>
            <VStack spacing={4}>
              <Text fontSize="lg" color={textColor}>Analytics temporarily unavailable</Text>
              <Text color={textColor} textAlign="center">
                We're working on improving the analytics experience. Please try again later.
              </Text>
            </VStack>
          </Center>
        </CardBody>
      </Card>
    </Box>
  );
};

export default SpendingAnalyticsFallback;
