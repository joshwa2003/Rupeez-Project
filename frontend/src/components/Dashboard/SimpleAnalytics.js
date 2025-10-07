import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  ButtonGroup,
  useColorModeValue,
  Heading,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
  Spinner,
  Center,
  Progress,
  Divider
} from '@chakra-ui/react';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';
import { useTransactions } from '../../contexts/TransactionContext';
import { useSavingsGoals } from '../../contexts/SavingsGoalContext';
import { chartService } from '../../services/chartService';

const SimpleAnalytics = () => {
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { savingsGoals, loading: savingsLoading } = useSavingsGoals();
  
  const [timeFilter, setTimeFilter] = useState('30d');
  const [chartType, setChartType] = useState('expense');
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');

  // Filter transactions based on time period
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    
    const dateRange = chartService.getDateRange(timeFilter);
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    });
  }, [transactions, timeFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredTransactions.length) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        netAmount: 0,
        savingsRate: 0,
        transactionCount: 0
      };
    }

    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = income - expense;
    const savingsRate = income > 0 ? ((netAmount / income) * 100) : 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      netAmount,
      savingsRate,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Process category data
  const categoryData = useMemo(() => {
    if (!filteredTransactions.length) return [];

    const categoryMap = {};
    filteredTransactions
      .filter(t => t.type === chartType)
      .forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        categoryMap[category] = (categoryMap[category] || 0) + transaction.amount;
      });

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, chartType]);

  const timeFilterOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' }
  ];

  if (transactionsLoading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color={textColor}>Loading analytics...</Text>
        </VStack>
      </Center>
    );
  }

  if (!filteredTransactions.length) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Text fontSize="lg" color={textColor}>No transactions found for the selected period</Text>
          <Text color={textColor} textAlign="center">
            Try adjusting the time filter or add some transactions to see analytics.
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      {/* Header with filters */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} mb={6}>
        <CardBody>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={2}>
              <Heading size="md" color={textColor}>Spending Analytics</Heading>
              <Text fontSize="sm" color={textColor} opacity={0.7}>
                Analyze your {chartType === 'expense' ? 'expenses' : 'income'} patterns
              </Text>
            </VStack>
            <HStack spacing={4} wrap="wrap">
              <Select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                size="sm"
                width="150px"
              >
                {timeFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <ButtonGroup size="sm" isAttached variant="outline">
                <Button
                  colorScheme={chartType === 'expense' ? 'blue' : 'gray'}
                  variant={chartType === 'expense' ? 'solid' : 'outline'}
                  onClick={() => setChartType('expense')}
                >
                  Expenses
                </Button>
                <Button
                  colorScheme={chartType === 'income' ? 'blue' : 'gray'}
                  variant={chartType === 'income' ? 'solid' : 'outline'}
                  onClick={() => setChartType('income')}
                >
                  Income
                </Button>
              </ButtonGroup>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Summary Statistics */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={6}>
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Total {chartType === 'expense' ? 'Expenses' : 'Income'}</StatLabel>
                <StatNumber color={textColor}>
                  ${summaryStats[chartType === 'expense' ? 'totalExpense' : 'totalIncome'].toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {summaryStats.transactionCount} transactions
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Net Amount</StatLabel>
                <StatNumber color={summaryStats.netAmount >= 0 ? 'green.500' : 'red.500'}>
                  ${summaryStats.netAmount.toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={summaryStats.netAmount >= 0 ? 'increase' : 'decrease'} />
                  {summaryStats.netAmount >= 0 ? 'Surplus' : 'Deficit'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Savings Rate</StatLabel>
                <StatNumber color={textColor}>
                  {summaryStats.savingsRate.toFixed(1)}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={summaryStats.savingsRate >= 0 ? 'increase' : 'decrease'} />
                  {summaryStats.savingsRate >= 0 ? 'Positive' : 'Negative'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Transactions</StatLabel>
                <StatNumber color={textColor}>
                  {summaryStats.transactionCount}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  In selected period
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Category Breakdown */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                {chartType === 'expense' ? 'Expense' : 'Income'} by Category
              </Heading>
            </CardHeader>
            <CardBody>
              {categoryData.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {categoryData.map((item, index) => {
                    const total = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
                    const percentage = (item.amount / total) * 100;
                    const colors = ['blue.500', 'green.500', 'yellow.500', 'red.500', 'purple.500', 'pink.500'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <Box key={item.category}>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text color={textColor} fontWeight="medium">
                            {item.category}
                          </Text>
                          <Text color={textColor} fontSize="sm">
                            ${item.amount.toFixed(2)} ({percentage.toFixed(1)}%)
                          </Text>
                        </Flex>
                        <Progress
                          value={percentage}
                          colorScheme={color}
                          size="sm"
                          borderRadius="md"
                        />
                      </Box>
                    );
                  })}
                </VStack>
              ) : (
                <Center py={8}>
                  <Text color={textColor} fontSize="sm">
                    No {chartType} data available for the selected period
                  </Text>
                </Center>
              )}
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                Quick Insights
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text color={textColor} fontWeight="medium" mb={2}>
                    Top Category
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    {categoryData.length > 0 ? categoryData[0].category : 'N/A'}
                  </Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text color={textColor} fontWeight="medium" mb={2}>
                    Average per Transaction
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    ${summaryStats.transactionCount > 0 
                      ? (summaryStats[chartType === 'expense' ? 'totalExpense' : 'totalIncome'] / summaryStats.transactionCount).toFixed(2)
                      : '0.00'
                    }
                  </Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text color={textColor} fontWeight="medium" mb={2}>
                    Financial Health
                  </Text>
                  <Badge
                    colorScheme={summaryStats.netAmount >= 0 ? 'green' : 'red'}
                    variant="subtle"
                    p={2}
                  >
                    {summaryStats.netAmount >= 0 ? 'Positive' : 'Needs Attention'}
                  </Badge>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default SimpleAnalytics;
