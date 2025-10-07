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
  Divider
} from '@chakra-ui/react';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';
import { useGroup } from '../../contexts/GroupContext';
import ApexPieChart from '../Charts/ApexPieChart';
import ApexBarChart from '../Charts/ApexBarChart';
import ApexLineChart from '../Charts/ApexLineChart';
import ApexDonutChart from '../Charts/ApexDonutChart';
import { chartService } from '../../services/chartService';

const GroupAnalytics = ({ groupId }) => {
  const { 
    groupExpenses, 
    groupBalances, 
    selectedGroup, 
    loading 
  } = useGroup();
  
  const [timeFilter, setTimeFilter] = useState('30d');
  const [chartType, setChartType] = useState('expenses');
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');

  // Filter expenses based on time period
  const filteredExpenses = useMemo(() => {
    if (!groupExpenses.length || !groupId) return [];
    
    const dateRange = chartService.getDateRange(timeFilter);
    return groupExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
    });
  }, [groupExpenses, groupId, timeFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
    const memberCount = selectedGroup?.members?.length || 0;
    const averagePerPerson = memberCount > 0 ? totalExpenses / memberCount : 0;
    
    // Calculate total owed/owing
    const totalOwed = groupBalances
      .filter(balance => balance.balance > 0)
      .reduce((sum, balance) => sum + balance.balance, 0);
    
    const totalOwing = groupBalances
      .filter(balance => balance.balance < 0)
      .reduce((sum, balance) => sum + Math.abs(balance.balance), 0);

    return {
      totalExpenses,
      averageExpense,
      memberCount,
      averagePerPerson,
      totalOwed,
      totalOwing,
      expenseCount: filteredExpenses.length
    };
  }, [filteredExpenses, selectedGroup, groupBalances]);

  // Process chart data
  const chartData = useMemo(() => {
    if (!filteredExpenses.length || !selectedGroup) return null;

    const memberData = chartService.processGroupExpenses(filteredExpenses, selectedGroup.members);
    
    // Process expenses by category
    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
      const category = expense.description || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryData = Object.values(categoryTotals);

    // Process expenses by time
    const timeTotals = {};
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timeTotals[key] = (timeTotals[key] || 0) + expense.amount;
    });

    const timeCategories = Object.keys(timeTotals).sort();
    const timeData = timeCategories.map(cat => timeTotals[cat]);

    // Process balance data
    const balanceLabels = groupBalances.map(balance => {
      const member = selectedGroup.members.find(m => 
        (m.userId && m.userId.toString() === balance.memberId.toString()) ||
        (m.friendId && m.friendId.toString() === balance.memberId.toString())
      );
      return member?.displayName || 'Unknown';
    });
    
    const balanceData = groupBalances.map(balance => Math.abs(balance.balance));

    return {
      memberData,
      categoryData: { labels: categoryLabels, data: categoryData },
      timeData: { categories: timeCategories, data: timeData },
      balanceData: { labels: balanceLabels, data: balanceData }
    };
  }, [filteredExpenses, selectedGroup, groupBalances]);

  const timeFilterOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  if (loading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color={textColor}>Loading group analytics...</Text>
        </VStack>
      </Center>
    );
  }

  if (!selectedGroup) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Text fontSize="lg" color={textColor}>No group selected</Text>
          <Text color={textColor} textAlign="center">
            Please select a group to view analytics.
          </Text>
        </VStack>
      </Center>
    );
  }

  if (!filteredExpenses.length) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Text fontSize="lg" color={textColor}>No expenses found for the selected period</Text>
          <Text color={textColor} textAlign="center">
            Try adjusting the time filter or add some expenses to see analytics.
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
              <Heading size="md" color={textColor}>
                {selectedGroup.name} - Analytics
              </Heading>
              <Text fontSize="sm" color={textColor}>
                Analyze group spending patterns and member contributions
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
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Summary Statistics */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6} mb={6}>
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Total Expenses</StatLabel>
                <StatNumber color="red.500">
                  {chartService.formatCurrency(summaryStats.totalExpenses, selectedGroup.defaultCurrency)}
                </StatNumber>
                <StatHelpText>
                  {summaryStats.expenseCount} expenses
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Average per Expense</StatLabel>
                <StatNumber color="blue.500">
                  {chartService.formatCurrency(summaryStats.averageExpense, selectedGroup.defaultCurrency)}
                </StatNumber>
                <StatHelpText>
                  Per transaction
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Average per Person</StatLabel>
                <StatNumber color="green.500">
                  {chartService.formatCurrency(summaryStats.averagePerPerson, selectedGroup.defaultCurrency)}
                </StatNumber>
                <StatHelpText>
                  {summaryStats.memberCount} members
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Outstanding Balance</StatLabel>
                <StatNumber color="orange.500">
                  {chartService.formatCurrency(summaryStats.totalOwed, selectedGroup.defaultCurrency)}
                </StatNumber>
                <StatHelpText>
                  To be settled
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Charts Grid */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Member Contributions */}
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                Expenses by Member
              </Heading>
            </CardHeader>
            <CardBody>
              {chartData?.memberData && (
                <ApexPieChart
                  data={chartData.memberData.data}
                  labels={chartData.memberData.labels}
                  title=""
                  height={300}
                />
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Category Breakdown */}
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                Expenses by Category
              </Heading>
            </CardHeader>
            <CardBody>
              {chartData?.categoryData && (
                <ApexDonutChart
                  data={chartData.categoryData.data}
                  labels={chartData.categoryData.labels}
                  title=""
                  height={300}
                  centerLabel="Total"
                />
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Time-based Spending */}
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                Daily Expenses
              </Heading>
            </CardHeader>
            <CardBody>
              {chartData?.timeData && (
                <ApexBarChart
                  data={chartData.timeData.data}
                  categories={chartData.timeData.categories}
                  title=""
                  height={300}
                  colors={['#FF4560']}
                />
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Member Balances */}
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                Member Balances
              </Heading>
            </CardHeader>
            <CardBody>
              {chartData?.balanceData && (
                <ApexBarChart
                  data={chartData.balanceData.data}
                  categories={chartData.balanceData.labels}
                  title=""
                  height={300}
                  colors={['#775DD0']}
                  horizontal={true}
                />
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default GroupAnalytics;
