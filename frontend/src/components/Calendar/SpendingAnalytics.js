import React, { useMemo } from 'react';
import {
  Box,
  Text,
  Flex,
  Grid,
  GridItem,
  VStack,
  HStack,
  Progress,
  useColorModeValue,
  Badge,
  Tag,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';
import { formatCurrency } from '../../services/currencyService';

const SpendingAnalytics = ({ transactions, selectedDate, selectedTransactions }) => {
  const textColor = useColorModeValue('gray.700', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtleBg = useColorModeValue('gray.50', 'gray.700');

  // Calculate analytics for selected date
  const dailyAnalytics = useMemo(() => {
    if (!selectedTransactions || selectedTransactions.length === 0) {
      return null;
    }

    const totalAmount = selectedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryBreakdown = {};
    const paymentMethodBreakdown = {};
    const hourlyBreakdown = {};

    selectedTransactions.forEach(transaction => {
      // Category breakdown
      if (!categoryBreakdown[transaction.category]) {
        categoryBreakdown[transaction.category] = { count: 0, amount: 0 };
      }
      categoryBreakdown[transaction.category].count++;
      categoryBreakdown[transaction.category].amount += transaction.amount;

      // Payment method breakdown
      if (!paymentMethodBreakdown[transaction.paymentMethod]) {
        paymentMethodBreakdown[transaction.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentMethodBreakdown[transaction.paymentMethod].count++;
      paymentMethodBreakdown[transaction.paymentMethod].amount += transaction.amount;

      // Hourly breakdown
      const hour = new Date(transaction.date).getHours();
      if (!hourlyBreakdown[hour]) {
        hourlyBreakdown[hour] = { count: 0, amount: 0 };
      }
      hourlyBreakdown[hour].count++;
      hourlyBreakdown[hour].amount += transaction.amount;
    });

    return {
      totalAmount,
      transactionCount: selectedTransactions.length,
      categoryBreakdown,
      paymentMethodBreakdown,
      hourlyBreakdown,
      avgTransactionAmount: totalAmount / selectedTransactions.length
    };
  }, [selectedTransactions]);

  // Calculate weekly patterns
  const weeklyPatterns = useMemo(() => {
    const weekStart = new Date(selectedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= weekStart && transactionDate <= weekEnd;
    });

    const dailyTotals = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dayTransactions = weekTransactions.filter(t => 
        new Date(t.date).toDateString() === day.toDateString()
      );
      dailyTotals[day.toLocaleDateString('en-US', { weekday: 'long' })] = 
        dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    }

    return dailyTotals;
  }, [transactions, selectedDate]);

  if (!dailyAnalytics) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center" py={8}>
            Select a date with transactions to view analytics
          </Text>
        </CardBody>
      </Card>
    );
  }

  const maxCategoryAmount = Math.max(...Object.values(dailyAnalytics.categoryBreakdown).map(c => c.amount));
  const maxHourlyAmount = Math.max(...Object.values(dailyAnalytics.hourlyBreakdown).map(h => h.amount));

  return (
    <VStack spacing={6} align="stretch">
      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <Text fontSize="lg" fontWeight="bold">Daily Summary</Text>
        </CardHeader>
        <CardBody>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                {formatCurrency(dailyAnalytics.totalAmount, 'INR')}
              </Text>
              <Text fontSize="sm" color="gray.500">Total Spent</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {dailyAnalytics.transactionCount}
              </Text>
              <Text fontSize="sm" color="gray.500">Transactions</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {formatCurrency(dailyAnalytics.avgTransactionAmount, 'INR')}
              </Text>
              <Text fontSize="sm" color="gray.500">Average per Transaction</Text>
            </Box>
          </Grid>
        </CardBody>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <Text fontSize="lg" fontWeight="bold">Spending by Category</Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={3} align="stretch">
            {Object.entries(dailyAnalytics.categoryBreakdown)
              .sort(([,a], [,b]) => b.amount - a.amount)
              .map(([category, data]) => (
                <Box key={category}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <HStack>
                      <Text fontWeight="medium">{category}</Text>
                      <Badge colorScheme="blue">{data.count}</Badge>
                    </HStack>
                    <Text fontWeight="bold">
                      {formatCurrency(data.amount, 'INR')}
                    </Text>
                  </Flex>
                  <Progress
                    value={(data.amount / maxCategoryAmount) * 100}
                    colorScheme="red"
                    size="sm"
                    borderRadius="md"
                  />
                </Box>
              ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <Text fontSize="lg" fontWeight="bold">Payment Methods</Text>
        </CardHeader>
        <CardBody>
          <Wrap spacing={3}>
            {Object.entries(dailyAnalytics.paymentMethodBreakdown).map(([method, data]) => (
              <WrapItem key={method}>
                <Tag size="lg" colorScheme="purple" variant="subtle">
                  {method}: {formatCurrency(data.amount, 'INR')} ({data.count})
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </CardBody>
      </Card>

      {/* Hourly Spending Pattern */}
      <Card>
        <CardHeader>
          <Text fontSize="lg" fontWeight="bold">Spending by Hour</Text>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(6, 1fr)" gap={2}>
            {Object.entries(dailyAnalytics.hourlyBreakdown)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([hour, data]) => (
                <Box key={hour} textAlign="center">
                  <Text fontSize="xs" color="gray.500">
                    {hour}:00
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {formatCurrency(data.amount, 'INR')}
                  </Text>
                  <Progress
                    value={(data.amount / maxHourlyAmount) * 100}
                    colorScheme="orange"
                    size="xs"
                    mt={1}
                  />
                </Box>
              ))}
          </Grid>
        </CardBody>
      </Card>

      {/* Weekly Pattern */}
      <Card>
        <CardHeader>
          <Text fontSize="lg" fontWeight="bold">Weekly Spending Pattern</Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={2} align="stretch">
            {Object.entries(weeklyPatterns).map(([day, amount]) => (
              <Flex key={day} justify="space-between" align="center">
                <Text fontWeight="medium" minW="100px">{day}</Text>
                <Progress
                  value={(amount / Math.max(...Object.values(weeklyPatterns))) * 100}
                  colorScheme="green"
                  size="sm"
                  flex="1"
                  mx={4}
                />
                <Text fontWeight="bold" minW="80px" textAlign="right">
                  {formatCurrency(amount, 'INR')}
                </Text>
              </Flex>
            ))}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default SpendingAnalytics;
