import React, { useState, useEffect, useCallback } from 'react';
import {
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Button,
  HStack,
  useToast,
  Spinner,
  VStack,
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
// Custom components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import TransactionTableRow from "components/Tables/TransactionTableRow";
import TransactionSearchFilter from "../TransactionSearch/TransactionSearchFilter";
import { useTransactions } from 'contexts/TransactionContext';
import { exportToExcel, exportToPDF, getExportSummary } from 'utils/exportUtils';
import { transactionsAPI } from '../../services/api';

const CategoryManager = () => {
  const { transactions } = useTransactions();
  const textColor = useColorModeValue("gray.700", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue('white', 'gray.800');
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  // Search and filter state
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalAmount: 0,
    incomeAmount: 0,
    expenseAmount: 0,
    transactionCount: 0
  });
  const [filters, setFilters] = useState({
    keyword: '',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: '',
    categories: [],
    transactionType: ''
  });

  // Fetch categories from transactions
  const fetchCategories = useCallback(async () => {
    try {
      // Extract unique categories from existing transactions
      const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
      const categoryObjects = uniqueCategories.map((cat, index) => ({
        id: cat,
        name: cat,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)` // Generate colors
      }));
      setCategories(categoryObjects);
    } catch (error) {
      console.error('Error processing categories:', error);
      // Set some default categories if processing fails
      setCategories([
        { id: 'food', name: 'Food', color: '#e53e3e' },
        { id: 'transport', name: 'Transport', color: '#3182ce' },
        { id: 'entertainment', name: 'Entertainment', color: '#38a169' },
        { id: 'shopping', name: 'Shopping', color: '#d69e2e' },
        { id: 'bills', name: 'Bills', color: '#805ad5' },
        { id: 'salary', name: 'Salary', color: '#00b5d8' }
      ]);
    }
  }, [transactions]);

  // Search transactions
  const searchTransactions = useCallback(async (searchFilters) => {
    setIsSearching(true);
    
    try {
      // If no filters are applied, use local transactions
      if (!searchFilters.keyword && !searchFilters.amountMin && !searchFilters.amountMax && 
          !searchFilters.dateFrom && !searchFilters.dateTo && searchFilters.categories.length === 0 && 
          !searchFilters.transactionType) {
        setFilteredTransactions(transactions);
        
        // Calculate local stats
        const stats = {
          transactionCount: transactions.length,
          incomeAmount: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
          expenseAmount: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
        };
        stats.totalAmount = stats.incomeAmount - stats.expenseAmount;
        setSearchStats(stats);
        setIsSearching(false);
        return;
      }

      // Build query parameters for API search
      const params = {
        page: 1,
        limit: 100, // Get more results for categories page
        ...searchFilters
      };

      // Convert categories array to comma-separated string for backend compatibility
      if (params.categories && Array.isArray(params.categories)) {
        params.categories = params.categories.join(',');
      }

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (!params[key] || (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });

      // Make API call
      const response = await transactionsAPI.search(params);
      
      if (response.success) {
        setFilteredTransactions(response.data.transactions || []);
        
        // Use search statistics from API response
        const stats = {
          totalAmount: response.data.statistics?.totalAmount || 0,
          incomeAmount: response.data.statistics?.incomeAmount || 0,
          expenseAmount: response.data.statistics?.expenseAmount || 0,
          transactionCount: response.data.statistics?.totalCount || 0
        };
        setSearchStats(stats);
      } else {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: 'Search Error',
        description: 'Failed to search transactions. Showing all transactions.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      // Fallback to local transactions
      setFilteredTransactions(transactions);
    } finally {
      setIsSearching(false);
    }
  }, [transactions, toast]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    searchTransactions(newFilters);
  }, [searchTransactions]);

  // Initialize data
  useEffect(() => {
    setFilteredTransactions(transactions);
    fetchCategories();
    
    // Calculate initial stats
    const stats = {
      transactionCount: transactions.length,
      incomeAmount: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      expenseAmount: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    };
    stats.totalAmount = stats.incomeAmount - stats.expenseAmount;
    setSearchStats(stats);
  }, [transactions, fetchCategories]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleExcelExport = async () => {
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    if (dataToExport.length === 0) {
      toast({
        title: 'No Data',
        description: 'No transactions available to export',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExporting(true);
    try {
      const result = exportToExcel(dataToExport, 'filtered_transactions');
      toast({
        title: 'Export Successful',
        description: result.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export Excel file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = async () => {
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    if (dataToExport.length === 0) {
      toast({
        title: 'No Data',
        description: 'No transactions available to export',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExporting(true);
    try {
      const result = exportToPDF(dataToExport, 'filtered_transactions');
      toast({
        title: 'Export Successful',
        description: result.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const displayTransactions = filteredTransactions.length > 0 ? filteredTransactions : transactions;

  return (
    <VStack spacing={6} align="stretch">
      {/* Search Statistics */}
      {searchStats.transactionCount > 0 && (
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <Stat>
              <StatLabel>Total Transactions</StatLabel>
              <StatNumber>{searchStats.transactionCount}</StatNumber>
            </Stat>
          </Box>
          
          <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <Stat>
              <StatLabel>Total Income</StatLabel>
              <StatNumber color="green.500">
                {formatCurrency(searchStats.incomeAmount)}
              </StatNumber>
            </Stat>
          </Box>
          
          <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <Stat>
              <StatLabel>Total Expenses</StatLabel>
              <StatNumber color="red.500">
                {formatCurrency(searchStats.expenseAmount)}
              </StatNumber>
            </Stat>
          </Box>
          
          <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <Stat>
              <StatLabel>Net Amount</StatLabel>
              <StatNumber color={searchStats.totalAmount >= 0 ? "green.500" : "red.500"}>
                {formatCurrency(searchStats.totalAmount)}
              </StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>
      )}

      {/* Search Filter Component */}
      <TransactionSearchFilter
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
        categories={categories}
        isLoading={isSearching}
      />

      {/* Transaction Management Table */}
      <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
        <CardHeader p="6px 0px 22px 0px">
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="xl" color={textColor} fontWeight="bold">
              Transaction Management
            </Text>
            <HStack spacing={3}>
              <Button
                leftIcon={isExporting ? <Spinner size="sm" /> : <DownloadIcon />}
                colorScheme="green"
                variant="outline"
                size="sm"
                onClick={handleExcelExport}
                isLoading={isExporting}
                loadingText="Exporting..."
              >
                Export Excel
              </Button>
              <Button
                leftIcon={isExporting ? <Spinner size="sm" /> : <DownloadIcon />}
                colorScheme="red"
                variant="outline"
                size="sm"
                onClick={handlePDFExport}
                isLoading={isExporting}
                loadingText="Exporting..."
              >
                Export PDF
              </Button>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {displayTransactions.length}
              </Text>
            </HStack>
          </Flex>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {filteredTransactions.length !== transactions.length ? 'Filtered' : 'Total'} Transactions
          </Text>
        </CardHeader>
        <CardBody>
          <Table variant="simple" color={textColor}>
            <Thead>
              <Tr my=".8rem" pl="0px" color="gray.400">
                <Th pl="0px" borderColor={borderColor} color="gray.400">
                  Transaction
                </Th>
                <Th borderColor={borderColor} color="gray.400">Type</Th>
                <Th borderColor={borderColor} color="gray.400">Amount</Th>
                <Th borderColor={borderColor} color="gray.400">Category</Th>
                <Th borderColor={borderColor} color="gray.400">Date</Th>
                <Th borderColor={borderColor} color="gray.400">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isSearching ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8} borderColor={borderColor}>
                    <Spinner size="lg" color="blue.500" />
                    <Text color="gray.500" mt={2}>Searching transactions...</Text>
                  </Td>
                </Tr>
              ) : displayTransactions.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8} borderColor={borderColor}>
                    <Text color="gray.500">
                      {filters.keyword || filters.amountMin || filters.amountMax || filters.dateFrom || filters.dateTo || filters.categories.length > 0 || filters.transactionType
                        ? "No transactions match your search criteria."
                        : "No transactions found. Add your first transaction!"
                      }
                    </Text>
                  </Td>
                </Tr>
              ) : (
                displayTransactions.map((transaction, index, arr) => {
                  return (
                    <TransactionTableRow
                      transaction={transaction}
                      isLast={index === arr.length - 1 ? true : false}
                      key={transaction.id}
                    />
                  );
                })
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default CategoryManager;
