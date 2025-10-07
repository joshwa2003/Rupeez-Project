// Chakra imports
import {
  Box,
  Button,
  Flex,
  Grid,
  Progress,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorMode,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";
// Custom components
import Card from "components/Card/Card.js";
import BarChart from "components/Charts/BarChart";
import LineChart from "components/Charts/LineChart";
import IconBox from "components/Icons/IconBox";
import SimpleAnalytics from "components/Dashboard/SimpleAnalytics";
// Custom icons
import {
  CartIcon,
  DocumentIcon,
  GlobeIcon,
  WalletIcon,
} from "components/Icons/Icons.js";
import React, { useState, useEffect } from "react";
// Variables
import {
  barChartOptions,
  lineChartOptions,
} from "variables/charts";

export default function Dashboard() {
  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    todaysMoney: { amount: 0, percentage: 0, trend: 'up' },
    monthlyIncome: { amount: 0, percentage: 0, trend: 'up' },
    recentTransactions: { amount: 0, percentage: 0, trend: 'up' },
    totalExpenses: { amount: 0, percentage: 0, trend: 'up' }
  });
  const [overviewChartData, setOverviewChartData] = useState([
    { name: 'Income', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'Expenses', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
  ]);
  const [performanceChartData, setPerformanceChartData] = useState([]);
  const [performanceCategories, setPerformanceCategories] = useState([]);
  const [recentIncome, setRecentIncome] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chakra Color Mode
  const iconBlue = useColorModeValue("blue.500", "blue.500");
  const iconBoxInside = useColorModeValue("white", "white");
  const textColor = useColorModeValue("gray.700", "white");
  const tableRowColor = useColorModeValue("#F7FAFC", "navy.900");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textTableColor = useColorModeValue("gray.500", "white");

  const { colorMode } = useColorMode();

  // Fetch dashboard data function
  const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Test API connectivity first
        try {
          const testRes = await fetch('/api/dashboard/test', { headers });
          const testData = await testRes.json();
          console.log('API Test Response:', testData);
          
          // If no transactions found, create sample data
          if (testData.status === 'success' && testData.data.transactionCount === 0) {
            console.log('No transactions found, creating sample data...');
            const sampleRes = await fetch('/api/dashboard/create-sample-data', { 
              method: 'POST',
              headers 
            });
            const sampleData = await sampleRes.json();
            console.log('Sample data creation result:', sampleData);
          }
        } catch (testError) {
          console.error('API Test Failed:', testError);
        }
        
        // Fetch all dashboard data in parallel
        const [statsRes, overviewRes, performanceRes, incomeRes, expensesRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers }),
          fetch('/api/dashboard/charts/overview', { headers }),
          fetch('/api/dashboard/charts/performance', { headers }),
          fetch('/api/dashboard/recent-income', { headers }),
          fetch('/api/dashboard/recent-expenses', { headers })
        ]);

        const [stats, overview, performance, income, expenses] = await Promise.all([
          statsRes.json(),
          overviewRes.json(),
          performanceRes.json(),
          incomeRes.json(),
          expensesRes.json()
        ]);

        console.log('API Responses:', { stats, overview, performance, income, expenses });

        if (stats.status === 'success') {
          console.log('Setting dashboard stats:', stats.data.stats);
          setDashboardStats(stats.data.stats);
        } else {
          console.error('Stats API error:', stats);
        }
        
        if (overview.status === 'success') {
          console.log('Setting overview chart data:', overview.data.chartData);
          setOverviewChartData(overview.data.chartData || [
            { name: 'Income', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { name: 'Expenses', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
          ]);
        } else {
          console.error('Overview API error:', overview);
        }
        
        if (performance.status === 'success') {
          console.log('Full performance response:', performance);
          console.log('Performance data object:', performance.data);
          console.log('Setting performance chart data:', performance.data.chartData);
          console.log('Setting performance categories:', performance.data.categories);
          
          // Only set data if we have actual categories and data
          if (performance.data.categories && performance.data.categories.length > 0) {
            setPerformanceChartData(performance.data.chartData);
            setPerformanceCategories(performance.data.categories);
          } else {
            // If no data, show empty state
            console.log('No categories found, setting empty state');
            setPerformanceChartData([]);
            setPerformanceCategories([]);
          }
        } else {
          console.error('Performance API error:', performance);
        }
        
        if (income.status === 'success') {
          console.log('Setting recent income:', income.data.recentIncome);
          setRecentIncome(income.data.recentIncome || []);
        } else {
          console.error('Income API error:', income);
        }
        
        if (expenses.status === 'success') {
          console.log('Setting recent expenses:', expenses.data.recentExpenses);
          setRecentExpenses(expenses.data.recentExpenses || []);
        } else {
          console.error('Expenses API error:', expenses);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh dashboard data every 30 seconds to pick up new transactions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="50vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Flex flexDirection='column' pt={{ base: "80px", md: "75px" }} px={{ base: "0px", md: "0px" }}>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={{ base: '16px', md: '24px' }} mb='20px'>
        <Card minH='125px' maxW={{ base: "100%", sm: "100%", md: "100%" }}>
          <Flex direction='column'>
            <Flex
              flexDirection='row'
              align='center'
              justify='center'
              w='100%'
              mb='25px'>
              <Stat me='auto'>
                <StatLabel
                  fontSize='xs'
                  color='gray.400'
                  fontWeight='bold'
                  textTransform='uppercase'>
                  Today's Balance
                </StatLabel>
                <Flex>
                  <StatNumber fontSize='lg' color={textColor} fontWeight='bold'>
                    {formatCurrency(dashboardStats.todaysMoney.amount)}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox
                borderRadius='50%'
                as='box'
                h={"45px"}
                w={"45px"}
                bg={iconBlue}>
                <WalletIcon h={"24px"} w={"24px"} color={iconBoxInside} />
              </IconBox>
            </Flex>
            <Text color='gray.400' fontSize='sm'>
              <Text as='span' color={dashboardStats.todaysMoney.trend === 'up' ? 'green.400' : 'red.400'} fontWeight='bold'>
                {dashboardStats.todaysMoney.trend === 'up' ? '+' : ''}{dashboardStats.todaysMoney.percentage.toFixed(2)}%{" "}
              </Text>
              Since last month
            </Text>
          </Flex>
        </Card>
        <Card minH='125px' maxW={{ base: "100%", sm: "100%", md: "100%" }}>
          <Flex direction='column'>
            <Flex
              flexDirection='row'
              align='center'
              justify='center'
              w='100%'
              mb='25px'>
              <Stat me='auto'>
                <StatLabel
                  fontSize='xs'
                  color='gray.400'
                  fontWeight='bold'
                  textTransform='uppercase'>
                  Monthly Income
                </StatLabel>
                <Flex>
                  <StatNumber fontSize='lg' color={textColor} fontWeight='bold'>
                    {formatCurrency(dashboardStats.monthlyIncome.amount)}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox
                borderRadius='50%'
                as='box'
                h={"45px"}
                w={"45px"}
                bg={iconBlue}>
                <GlobeIcon h={"24px"} w={"24px"} color={iconBoxInside} />
              </IconBox>
            </Flex>
            <Text color='gray.400' fontSize='sm'>
              <Text as='span' color={dashboardStats.monthlyIncome.trend === 'up' ? 'green.400' : 'red.400'} fontWeight='bold'>
                {dashboardStats.monthlyIncome.trend === 'up' ? '+' : ''}{dashboardStats.monthlyIncome.percentage.toFixed(2)}%{" "}
              </Text>
              Since last month
            </Text>
          </Flex>
        </Card>
        <Card minH='125px' maxW={{ base: "100%", sm: "100%", md: "100%" }}>
          <Flex direction='column'>
            <Flex
              flexDirection='row'
              align='center'
              justify='center'
              w='100%'
              mb='25px'>
              <Stat me='auto'>
                <StatLabel
                  fontSize='xs'
                  color='gray.400'
                  fontWeight='bold'
                  textTransform='uppercase'>
                  Recent Transactions
                </StatLabel>
                <Flex>
                  <StatNumber fontSize='lg' color={textColor} fontWeight='bold'>
                    {dashboardStats.recentTransactions.amount}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox
                borderRadius='50%'
                as='box'
                h={"45px"}
                w={"45px"}
                bg={iconBlue}>
                <DocumentIcon h={"24px"} w={"24px"} color={iconBoxInside} />
              </IconBox>
            </Flex>
            <Text color='gray.400' fontSize='sm'>
              <Text as='span' color={dashboardStats.recentTransactions.trend === 'up' ? 'green.400' : 'red.400'} fontWeight='bold'>
                {dashboardStats.recentTransactions.trend === 'up' ? '+' : ''}{dashboardStats.recentTransactions.percentage.toFixed(2)}%{" "}
              </Text>
              Last 7 days
            </Text>
          </Flex>
        </Card>
        <Card minH='125px' maxW={{ base: "100%", sm: "100%", md: "100%" }}>
          <Flex direction='column'>
            <Flex
              flexDirection='row'
              align='center'
              justify='center'
              w='100%'
              mb='25px'>
              <Stat me='auto'>
                <StatLabel
                  fontSize='xs'
                  color='gray.400'
                  fontWeight='bold'
                  textTransform='uppercase'>
                  Total Expenses
                </StatLabel>
                <Flex>
                  <StatNumber fontSize='lg' color={textColor} fontWeight='bold'>
                    {formatCurrency(dashboardStats.totalExpenses.amount)}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox
                borderRadius='50%'
                as='box'
                h={"45px"}
                w={"45px"}
                bg={iconBlue}>
                <CartIcon h={"24px"} w={"24px"} color={iconBoxInside} />
              </IconBox>
            </Flex>
            <Text color='gray.400' fontSize='sm'>
              <Text as='span' color={dashboardStats.totalExpenses.trend === 'up' ? 'red.400' : 'green.400'} fontWeight='bold'>
                {dashboardStats.totalExpenses.trend === 'up' ? '+' : ''}{dashboardStats.totalExpenses.percentage.toFixed(2)}%{" "}
              </Text>
              Since last month
            </Text>
          </Flex>
        </Card>
      </SimpleGrid>
      <Grid
        templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
        templateRows={{ base: "repeat(4, auto)", lg: "repeat(2, auto)" }}
        gap={{ base: '16px', md: '20px' }}>
        <Card
          bg={
            colorMode === "dark"
              ? "navy.800"
              : "linear-gradient(81.62deg, #313860 2.25%, #151928 79.87%)"
          }
          p='0px'
          maxW={{ base: "100%", md: "100%" }}
          w="100%">
          <Flex direction='column' mb='40px' p='28px 0px 0px 22px'>
            <Text color='#fff' fontSize='lg' fontWeight='bold' mb='6px'>
              Transaction Overview
            </Text>
            <Text color='#fff' fontSize='sm'>
              <Text as='span' color='green.400' fontWeight='bold'>
                Income vs Expenses{" "}
              </Text>
              for {new Date().getFullYear()}
            </Text>
          </Flex>
          <Box minH='300px'>
            {overviewChartData && overviewChartData.length > 0 ? (
              <LineChart
                chartData={overviewChartData}
                chartOptions={lineChartOptions}
              />
            ) : (
              <Flex justify="center" align="center" h="300px">
                <Text color="#fff">No data available</Text>
              </Flex>
            )}
          </Box>
        </Card>
        <Card p='0px' maxW={{ base: "100%", md: "100%" }} w="100%">
          <Flex direction='column' mb='40px' p='28px 0px 0px 22px'>
            <Text color='gray.400' fontSize='sm' fontWeight='bold' mb='6px'>
              EXPENSE CATEGORIES
            </Text>
            <Text color={textColor} fontSize='lg' fontWeight='bold'>
              Monthly Spending
            </Text>
          </Flex>
          <Box minH='300px'>
            {performanceChartData && performanceChartData.length > 0 && performanceCategories.length > 0 ? (
              <BarChart 
                chartData={performanceChartData} 
                chartOptions={{
                  ...barChartOptions,
                  xaxis: {
                    ...barChartOptions.xaxis,
                    categories: performanceCategories
                  }
                }} 
              />
            ) : (
              <Flex justify="center" align="center" h="300px">
                <Text color={textColor}>No expense data available</Text>
              </Flex>
            )}
          </Box>
        </Card>
        <Card p='0px' maxW={{ base: "100%", md: "100%" }} w="100%">
          <Flex direction='column'>
            <Flex align='center' justify='space-between' p={{ base: '16px', md: '22px' }}>
              <Text fontSize={{ base: 'md', md: 'lg' }} color={textColor} fontWeight='bold'>
                Recent Income
              </Text>
              <Button variant='primary' maxH='30px' size={{ base: 'sm', md: 'md' }}>
                SEE ALL
              </Button>
            </Flex>
            <Box overflow={{ base: "auto", lg: "hidden" }} maxWidth="100%">
              <Table>
                <Thead>
                  <Tr bg={tableRowColor}>
                    <Th color='gray.400' borderColor={borderColor}>
                      Source
                    </Th>
                    <Th color='gray.400' borderColor={borderColor}>
                      Amount
                    </Th>
                    <Th color='gray.400' borderColor={borderColor}>
                      Date
                    </Th>
                    <Th color='gray.400' borderColor={borderColor}>
                      Status
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentIncome.length > 0 ? recentIncome.map((el, index, arr) => {
                    return (
                      <Tr key={index}>
                        <Td
                          color={textTableColor}
                          fontSize='sm'
                          fontWeight='bold'
                          borderColor={borderColor}
                          border={index === arr.length - 1 ? "none" : null}>
                          {el.source}
                        </Td>
                        <Td
                          color={textTableColor}
                          fontSize='sm'
                          border={index === arr.length - 1 ? "none" : null}
                          borderColor={borderColor}>
                          {el.amount}
                        </Td>
                        <Td
                          color={textTableColor}
                          fontSize='sm'
                          border={index === arr.length - 1 ? "none" : null}
                          borderColor={borderColor}>
                          {el.date}
                        </Td>
                        <Td
                          color={textTableColor}
                          fontSize='sm'
                          border={index === arr.length - 1 ? "none" : null}
                          borderColor={borderColor}>
                          <Text color='green.400' fontWeight='bold'>
                            {el.status}
                          </Text>
                        </Td>
                      </Tr>
                    );
                  }) : (
                    <Tr>
                      <Td colSpan={4} textAlign="center" color={textTableColor}>
                        No recent income transactions
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </Flex>
        </Card>
        <Card p='0px' maxW={{ base: "100%", md: "100%" }} w="100%">
          <Flex direction='column'>
            <Flex align='center' justify='space-between' p={{ base: '16px', md: '22px' }}>
              <Text fontSize={{ base: 'md', md: 'lg' }} color={textColor} fontWeight='bold'>
                Expense Categories
              </Text>
              <Button variant='primary' maxH='30px' size={{ base: 'sm', md: 'md' }}>
                SEE ALL
              </Button>
            </Flex>
          </Flex>
          <Box overflow={{ base: "auto", lg: "hidden" }} maxWidth="100%">
            <Table>
              <Thead>
                <Tr bg={tableRowColor}>
                  <Th color='gray.400' borderColor={borderColor}>
                    Category
                  </Th>
                  <Th color='gray.400' borderColor={borderColor}>
                    Amount
                  </Th>
                  <Th color='gray.400' borderColor={borderColor}>
                    Percentage
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentExpenses.length > 0 ? recentExpenses.map((el, index, arr) => {
                  return (
                    <Tr key={index}>
                      <Td
                        color={textTableColor}
                        fontSize='sm'
                        fontWeight='bold'
                        borderColor={borderColor}
                        border={index === arr.length - 1 ? "none" : null}>
                        {el.category}
                      </Td>
                      <Td
                        color={textTableColor}
                        fontSize='sm'
                        borderColor={borderColor}
                        border={index === arr.length - 1 ? "none" : null}>
                        {el.amount}
                      </Td>
                      <Td
                        color={textTableColor}
                        fontSize='sm'
                        borderColor={borderColor}
                        border={index === arr.length - 1 ? "none" : null}>
                        <Flex align='center'>
                          <Text
                            color={textTableColor}
                            fontWeight='bold'
                            fontSize='sm'
                            me='12px'>{`${el.percentage}%`}</Text>
                          <Progress
                            size='xs'
                            colorScheme={el.color}
                            value={el.percentage}
                            minW='120px'
                          />
                        </Flex>
                      </Td>
                    </Tr>
                  );
                }) : (
                  <Tr>
                    <Td colSpan={3} textAlign="center" color={textTableColor}>
                      No recent expense data
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>
      </Grid>

              {/* Simple Analytics Section */}
              <Box mt={8}>
                <SimpleAnalytics />
              </Box>
    </Flex>
  );
}
