import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
  Grid,
  GridItem,
  useColorModeValue,
  Badge,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Divider,
  IconButton,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Tag,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, CalendarIcon } from '@chakra-ui/icons';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency } from '../../services/currencyService';

const ExpenseCalendar = () => {
  const { transactions, loading, error } = useTransactions();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // UI colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const subtleBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('month'); // month, week, day

  // Get current month/year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter transactions by date range and filters
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => t.type === 'expense');
    
    // Date range filter
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });
    
    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(t => 
        t.category.toLowerCase().includes(filterCategory.toLowerCase())
      );
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [transactions, currentYear, currentMonth, filterCategory, searchTerm]);

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const grouped = {};
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });
    return grouped;
  }, [filteredTransactions]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks
      const dayTransactions = transactionsByDate[current.toDateString()] || [];
      const totalAmount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === currentMonth,
        isToday: current.toDateString() === new Date().toDateString(),
        transactions: dayTransactions,
        totalAmount,
        transactionCount: dayTransactions.length
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentYear, currentMonth, transactionsByDate]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))];
    return uniqueCategories.sort();
  }, [transactions]);

  // Monthly statistics
  const monthlyStats = useMemo(() => {
    const totalExpenses = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgDaily = totalExpenses / new Date(currentYear, currentMonth + 1, 0).getDate();
    const highestDay = Math.max(...calendarDays.map(d => d.totalAmount));
    const totalTransactions = filteredTransactions.length;
    
    return {
      totalExpenses,
      avgDaily,
      highestDay,
      totalTransactions
    };
  }, [filteredTransactions, calendarDays, currentYear, currentMonth]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date click
  const handleDateClick = (day) => {
    setSelectedDate(day.date);
    setSelectedTransactions(day.transactions);
    onOpen();
  };

  // Get spending intensity color
  const getSpendingColor = (amount, maxAmount) => {
    if (amount === 0) return 'gray.100';
    const intensity = Math.min(amount / maxAmount, 1);
    if (intensity < 0.3) return 'green.100';
    if (intensity < 0.6) return 'yellow.100';
    if (intensity < 0.8) return 'orange.100';
    return 'red.100';
  };

  const maxDailyAmount = Math.max(...calendarDays.map(d => d.totalAmount));

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load transactions
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with navigation and filters */}
      <Card mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                Expense Calendar
              </Text>
              <Text fontSize="sm" color="gray.500">
                Visualize your daily spending patterns
              </Text>
            </VStack>
            
            <HStack spacing={4} wrap="wrap">
              <InputGroup maxW="200px">
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search transactions"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                />
              </InputGroup>
              
              <Select
                placeholder="All Categories"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                maxW="150px"
                size="sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
              
              <Button onClick={goToToday} size="sm" variant="outline">
                Today
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
      </Card>

      {/* Monthly Statistics */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Expenses</StatLabel>
              <StatNumber fontSize="lg">
                {formatCurrency(monthlyStats.totalExpenses, 'INR')}
              </StatNumber>
              <StatHelpText>This month</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Daily Average</StatLabel>
              <StatNumber fontSize="lg">
                {formatCurrency(monthlyStats.avgDaily, 'INR')}
              </StatNumber>
              <StatHelpText>Per day</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Highest Day</StatLabel>
              <StatNumber fontSize="lg">
                {formatCurrency(monthlyStats.highestDay, 'INR')}
              </StatNumber>
              <StatHelpText>Single day</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Transactions</StatLabel>
              <StatNumber fontSize="lg">
                {monthlyStats.totalTransactions}
              </StatNumber>
              <StatHelpText>This month</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <IconButton
                icon={<ChevronLeftIcon />}
                onClick={goToPreviousMonth}
                variant="outline"
                size="sm"
              />
              <Text fontSize="xl" fontWeight="bold" minW="200px" textAlign="center">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
              <IconButton
                icon={<ChevronRightIcon />}
                onClick={goToNextMonth}
                variant="outline"
                size="sm"
              />
            </HStack>
            
            <HStack spacing={2}>
              <Button size="sm" variant="outline" onClick={goToToday}>
                <CalendarIcon mr={2} />
                Today
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody>
          {/* Calendar Grid */}
          <Grid templateColumns="repeat(7, 1fr)" gap={1}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <GridItem key={day} p={2} textAlign="center">
                <Text fontSize="sm" fontWeight="bold" color="gray.500">
                  {day}
                </Text>
              </GridItem>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <GridItem key={index}>
                <Tooltip
                  label={
                    day.transactionCount > 0 
                      ? `${day.transactionCount} transactions, ${formatCurrency(day.totalAmount, 'INR')}`
                      : 'No transactions'
                  }
                >
                  <Box
                    h="100px"
                    p={2}
                    border="1px solid"
                    borderColor={borderColor}
                    bg={day.isCurrentMonth ? bgColor : subtleBg}
                    cursor="pointer"
                    position="relative"
                    onClick={() => handleDateClick(day)}
                    _hover={{
                      bg: day.isCurrentMonth ? accentColor : 'gray.100',
                      color: 'white'
                    }}
                    borderRadius="md"
                  >
                    <VStack spacing={1} h="100%" justify="start">
                      <Text
                        fontSize="sm"
                        fontWeight={day.isToday ? 'bold' : 'normal'}
                        color={day.isCurrentMonth ? textColor : 'gray.400'}
                        textAlign="center"
                      >
                        {day.date.getDate()}
                      </Text>
                      
                      {day.transactionCount > 0 && (
                        <VStack spacing={0.5} w="100%">
                          <Badge
                            size="sm"
                            colorScheme="blue"
                            variant="solid"
                          >
                            {day.transactionCount}
                          </Badge>
                          <Text fontSize="xs" noOfLines={1}>
                            {formatCurrency(day.totalAmount, 'INR')}
                          </Text>
                        </VStack>
                      )}
                      
                      {/* Spending intensity indicator */}
                      {day.totalAmount > 0 && (
                        <Box
                          position="absolute"
                          bottom={0}
                          left={0}
                          right={0}
                          h="3px"
                          bg={getSpendingColor(day.totalAmount, maxDailyAmount)}
                          borderRadius="0 0 4px 4px"
                        />
                      )}
                    </VStack>
                  </Box>
                </Tooltip>
              </GridItem>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {/* Transaction Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Transactions for {selectedDate?.toLocaleDateString()}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedTransactions.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                No transactions for this date
              </Text>
            ) : (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">
                    {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''}
                  </Text>
                  <Text fontWeight="bold" color="red.500">
                    Total: {formatCurrency(
                      selectedTransactions.reduce((sum, t) => sum + t.amount, 0),
                      'INR'
                    )}
                  </Text>
                </HStack>
                
                <Divider />
                
                {selectedTransactions.map((transaction, index) => (
                  <Box
                    key={index}
                    p={4}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    bg={subtleBg}
                  >
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{transaction.category}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {transaction.paymentMethod} • {transaction.notes || 'No notes'}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {new Date(transaction.date).toLocaleTimeString()}
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Text fontWeight="bold" color="red.500">
                          -{formatCurrency(transaction.amount, transaction.currency)}
                        </Text>
                        <Tag size="sm" colorScheme="blue">
                          {transaction.status}
                        </Tag>
                      </VStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ExpenseCalendar;
