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
  Center
} from '@chakra-ui/react';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';
import { useTransactions } from '../../contexts/TransactionContext';
import { useSavingsGoals } from '../../contexts/SavingsGoalContext';
import ApexPieChart from '../Charts/ApexPieChart';
import ApexBarChart from '../Charts/ApexBarChart';
import ApexLineChart from '../Charts/ApexLineChart';
import ApexDonutChart from '../Charts/ApexDonutChart';
import ChartErrorBoundary from '../Charts/ErrorBoundary';
import SafeApexChart from '../Charts/SafeApexChart';
import { chartService } from '../../services/chartService';

const SpendingAnalytics = () => {
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { savingsGoals, loading: savingsLoading } = useSavingsGoals();
  
  const [timeFilter, setTimeFilter] = useState('30d');
  const [chartType, setChartType] = useState('expense');
  const [isDataReady, setIsDataReady] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  const [categoryChartType, setCategoryChartType] = useState('pie'); // 'pie' or 'bar'
  const [timeChartType, setTimeChartType] = useState('bar'); // 'bar' or 'line'
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');

  // Set data ready state
  useEffect(() => {
    if (!transactionsLoading && transactions && transactions.length > 0) {
      setIsDataReady(true);
      // Add a small delay to ensure data is fully processed
      setTimeout(() => {
        setChartsReady(true);
      }, 500);
    } else {
      setIsDataReady(false);
      setChartsReady(false);
    }
  }, [transactionsLoading, transactions]);

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
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Process chart data
  const chartData = useMemo(() => {
    if (!filteredTransactions.length || !isDataReady) return null;

    try {
      const categoryData = chartService.processSpendingByCategory(filteredTransactions, chartType);
      const timeData = chartService.processSpendingByTime(filteredTransactions, 'daily', chartType);
      const incomeVsExpense = chartService.processIncomeVsExpense(filteredTransactions, 'daily');
      const trendData = chartService.processTrendAnalysis(filteredTransactions, chartType, 30);

      // Validate data before returning
      const isValidData = (data) => {
        if (!data) return false;
        if (!data.data || !Array.isArray(data.data)) return false;
        if (data.data.length === 0) return false;
        if (!data.data.every(val => typeof val === 'number' && !isNaN(val) && val >= 0)) return false;
        return true;
      };
      
      return {
        categoryData: isValidData(categoryData) ? categoryData : null,
        timeData: isValidData(timeData) ? timeData : null,
        incomeVsExpense: isValidData(incomeVsExpense) ? incomeVsExpense : null,
        trendData: isValidData(trendData) ? trendData : null
      };
    } catch (error) {
      console.error('Error processing chart data:', error);
      return null;
    }
  }, [filteredTransactions, chartType, isDataReady]);

  const timeFilterOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' }
  ];

  if (transactionsLoading || !isDataReady || !chartsReady || !chartData) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color={textColor}>Loading analytics...</Text>
        </VStack>
      </Center>
    );
  }

  if (!filteredTransactions.length || !chartData) {
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
              <Text fontSize="sm" color={textColor}>
                Analyze your financial patterns and trends
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
              
              <ButtonGroup size="sm" isAttached>
                <Button
                  colorScheme={chartType === 'expense' ? 'blue' : 'gray'}
                  onClick={() => setChartType('expense')}
                >
                  Expenses
                </Button>
                <Button
                  colorScheme={chartType === 'income' ? 'green' : 'gray'}
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
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6} mb={6}>
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Total Income</StatLabel>
                <StatNumber color="green.500">
                  {chartService.formatCurrency(summaryStats.totalIncome)}
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
                <StatLabel color={textColor}>Total Expenses</StatLabel>
                <StatNumber color="red.500">
                  {chartService.formatCurrency(summaryStats.totalExpenses)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
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
                <StatLabel color={textColor}>Net Income</StatLabel>
                <StatNumber color={summaryStats.netIncome >= 0 ? 'green.500' : 'red.500'}>
                  {chartService.formatCurrency(summaryStats.netIncome)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={summaryStats.netIncome >= 0 ? 'increase' : 'decrease'} />
                  {summaryStats.savingsRate.toFixed(1)}% savings rate
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Savings Goals</StatLabel>
                <StatNumber color="blue.500">
                  {savingsGoals.length}
                </StatNumber>
                <StatHelpText>
                  Active goals
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Charts Grid */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Category Breakdown */}
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md" color={textColor}>
                  {chartType === 'expense' ? 'Expense' : 'Income'} by Category
                </Heading>
                <ButtonGroup size="sm" isAttached variant="outline">
                  <Button
                    colorScheme={categoryChartType === 'pie' ? 'blue' : 'gray'}
                    variant={categoryChartType === 'pie' ? 'solid' : 'outline'}
                    onClick={() => setCategoryChartType('pie')}
                  >
                    Pie
                  </Button>
                  <Button
                    colorScheme={categoryChartType === 'bar' ? 'blue' : 'gray'}
                    variant={categoryChartType === 'bar' ? 'solid' : 'outline'}
                    onClick={() => setCategoryChartType('bar')}
                  >
                    Bar
                  </Button>
                </ButtonGroup>
              </Flex>
            </CardHeader>
            <CardBody>
              <SafeApexChart
                data={chartData?.categoryData?.data}
                labels={chartData?.categoryData?.labels}
                height={300}
                fallbackText="No category data available"
              >
                <ChartErrorBoundary height={300}>
                  {categoryChartType === 'pie' ? (
                    <ApexPieChart
                      data={chartData.categoryData.data}
                      labels={chartData.categoryData.labels}
                      title=""
                      height={300}
                    />
                  ) : (
                    <ApexBarChart
                      data={chartData.categoryData.data}
                      categories={chartData.categoryData.labels}
                      title=""
                      height={300}
                      colors={[chartType === 'expense' ? '#FF4560' : '#00E396']}
                      horizontal={false}
                    />
                  )}
                </ChartErrorBoundary>
              </SafeApexChart>
            </CardBody>
          </Card>
        </GridItem>

        {/* Time-based Spending */}
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md" color={textColor}>
                  Daily {chartType === 'expense' ? 'Expenses' : 'Income'}
                </Heading>
                <ButtonGroup size="sm" isAttached variant="outline">
                  <Button
                    colorScheme={timeChartType === 'bar' ? 'blue' : 'gray'}
                    variant={timeChartType === 'bar' ? 'solid' : 'outline'}
                    onClick={() => setTimeChartType('bar')}
                  >
                    Bar
                  </Button>
                  <Button
                    colorScheme={timeChartType === 'line' ? 'blue' : 'gray'}
                    variant={timeChartType === 'line' ? 'solid' : 'outline'}
                    onClick={() => setTimeChartType('line')}
                  >
                    Line
                  </Button>
                </ButtonGroup>
              </Flex>
            </CardHeader>
            <CardBody>
              <SafeApexChart
                data={chartData?.timeData?.data}
                labels={chartData?.timeData?.categories}
                height={300}
                fallbackText="No time data available"
              >
                <ChartErrorBoundary height={300}>
                  {timeChartType === 'bar' ? (
                    <ApexBarChart
                      data={chartData.timeData.data}
                      categories={chartData.timeData.categories}
                      title=""
                      height={300}
                      colors={[chartType === 'expense' ? '#FF4560' : '#00E396']}
                    />
                  ) : (
                    <ApexLineChart
                      data={chartData.timeData.data}
                      categories={chartData.timeData.categories}
                      title=""
                      height={300}
                      colors={[chartType === 'expense' ? '#FF4560' : '#00E396']}
                      type="line"
                    />
                  )}
                </ChartErrorBoundary>
              </SafeApexChart>
            </CardBody>
          </Card>
        </GridItem>

        {/* Income vs Expenses Trend */}
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                Income vs Expenses Trend
              </Heading>
            </CardHeader>
            <CardBody>
              {chartData?.incomeVsExpense && chartData.incomeVsExpense.series && chartData.incomeVsExpense.series.length > 0 ? (
                <ChartErrorBoundary height={300}>
                  <ApexLineChart
                    data={chartData.incomeVsExpense.series}
                    categories={chartData.incomeVsExpense.categories}
                    title=""
                    height={300}
                    type="area"
                    colors={['#00E396', '#FF4560']}
                  />
                </ChartErrorBoundary>
              ) : (
                <Box height={300} display="flex" alignItems="center" justifyContent="center">
                  <Text color={textColor} fontSize="sm">No income vs expense data available</Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Trend Analysis */}
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                {chartType === 'expense' ? 'Expense' : 'Income'} Trend (30 Days)
              </Heading>
            </CardHeader>
            <CardBody>
              {chartData?.trendData && chartData.trendData.data && chartData.trendData.data.length > 0 ? (
                <ChartErrorBoundary height={300}>
                  <ApexLineChart
                    data={chartData.trendData.data}
                    categories={chartData.trendData.categories}
                    title=""
                    height={300}
                    type="spline"
                    colors={[chartType === 'expense' ? '#FF4560' : '#00E396']}
                    showMarkers={true}
                  />
                </ChartErrorBoundary>
              ) : (
                <Box height={300} display="flex" alignItems="center" justifyContent="center">
                  <Text color={textColor} fontSize="sm">No trend data available</Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default SpendingAnalytics;
