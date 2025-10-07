import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useToast,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';
import TransactionSearchFilter from '../../components/TransactionSearch/TransactionSearchFilter';
import TransactionSearchResults from '../../components/TransactionSearch/TransactionSearchResults';
import { transactionsAPI } from '../../services/api';

const TransactionSearch = () => {
  // Hooks
  const history = useHistory();
  const location = useLocation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Search and filter state
  const [filters, setFilters] = useState({
    keyword: '',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: '',
    categories: [],
    transactionType: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0
  });

  // Search statistics
  const [searchStats, setSearchStats] = useState({
    totalAmount: 0,
    incomeAmount: 0,
    expenseAmount: 0,
    transactionCount: 0
  });

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Load URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlFilters = {
      keyword: urlParams.get('keyword') || '',
      amountMin: urlParams.get('amountMin') || '',
      amountMax: urlParams.get('amountMax') || '',
      dateFrom: urlParams.get('dateFrom') || '',
      dateTo: urlParams.get('dateTo') || '',
      categories: urlParams.get('categories')?.split(',').filter(Boolean) || [],
      transactionType: urlParams.get('type') || ''
    };
    
    const page = parseInt(urlParams.get('page')) || 1;
    const size = parseInt(urlParams.get('size')) || 25;

    setFilters(urlFilters);
    setPagination(prev => ({ ...prev, currentPage: page, pageSize: size }));
  }, [location.search]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters, newPagination = pagination) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value.toString());
        }
      }
    });

    if (newPagination.currentPage > 1) {
      params.set('page', newPagination.currentPage.toString());
    }
    if (newPagination.pageSize !== 25) {
      params.set('size', newPagination.pageSize.toString());
    }

    const newURL = `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    history.replace(newURL);
  }, [history, location.pathname, pagination]);

  // Fetch categories from transactions (since categories are stored as strings)
  const fetchCategories = useCallback(async () => {
    try {
      // Get unique categories from existing transactions
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/transactions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          // Extract unique categories from transactions
          const uniqueCategories = [...new Set(result.data.map(t => t.category).filter(Boolean))];
          const categoryObjects = uniqueCategories.map((cat, index) => ({
            id: cat,
            name: cat,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)` // Generate colors
          }));
          setCategories(categoryObjects);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set some default categories if fetch fails
      setCategories([
        { id: 'food', name: 'Food', color: '#e53e3e' },
        { id: 'transport', name: 'Transport', color: '#3182ce' },
        { id: 'entertainment', name: 'Entertainment', color: '#38a169' },
        { id: 'shopping', name: 'Shopping', color: '#d69e2e' },
        { id: 'bills', name: 'Bills', color: '#805ad5' },
        { id: 'salary', name: 'Salary', color: '#00b5d8' }
      ]);
    }
  }, []);

  // Search transactions
  const searchTransactions = useCallback(async (searchFilters = filters, paginationParams = pagination) => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = {
        page: paginationParams.currentPage,
        limit: paginationParams.pageSize,
        ...searchFilters
      };

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (!params[key] || (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });

      // Make API call
      const response = await transactionsAPI.search(params);
      
      if (response.success) {
        setTransactions(response.data.transactions || []);
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.pagination?.totalCount || 0,
          totalPages: response.data.pagination?.totalPages || 0
        }));

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
      setError(err.message);
      setTransactions([]);
      setPagination(prev => ({ ...prev, totalCount: 0, totalPages: 0 }));
      setSearchStats({ totalAmount: 0, incomeAmount: 0, expenseAmount: 0, transactionCount: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    const newPagination = { ...pagination, currentPage: 1 };
    setPagination(newPagination);
    updateURL(newFilters, newPagination);
    searchTransactions(newFilters, newPagination);
  }, [pagination, updateURL, searchTransactions]);

  // Handle pagination changes
  const handlePageChange = useCallback((newPage) => {
    const newPagination = { ...pagination, currentPage: newPage };
    setPagination(newPagination);
    updateURL(filters, newPagination);
    searchTransactions(filters, newPagination);
  }, [filters, pagination, updateURL, searchTransactions]);

  const handlePageSizeChange = useCallback((newPageSize) => {
    const newPagination = { ...pagination, pageSize: newPageSize, currentPage: 1 };
    setPagination(newPagination);
    updateURL(filters, newPagination);
    searchTransactions(filters, newPagination);
  }, [filters, pagination, updateURL, searchTransactions]);

  // Transaction actions
  const handleTransactionView = (transaction) => {
    setSelectedTransaction(transaction);
    onOpen();
  };

  const handleTransactionEdit = (transaction) => {
    history.push(`/admin/add-transaction?edit=${transaction.id}`);
  };

  const handleTransactionDelete = async (transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionsAPI.delete(transaction.id);
        toast({
          title: 'Transaction deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Refresh search results
        searchTransactions();
      } catch (error) {
        toast({
          title: 'Error deleting transaction',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Export results
  const handleExportResults = async () => {
    try {
      // Create CSV content
      const csvHeaders = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Notes'];
      const csvRows = transactions.map(t => [
        t.date,
        t.description,
        t.category?.name || '',
        t.amount,
        t.type,
        t.notes || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_search_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export successful',
        description: 'Transaction data has been exported to CSV',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Load initial data
  useEffect(() => {
    fetchCategories();
    searchTransactions();
  }, []); // Only run once on mount

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Box bg={bgColor} minH="100vh" p={4}>
      <VStack spacing={6} align="stretch" maxW="1200px" mx="auto">
        {/* Breadcrumb */}
        <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />}>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => history.push('/admin/dashboard')}>
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">Transaction Search</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Page Header */}
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Transaction Search & Filter
          </Text>
          <Text color="gray.600">
            Search and filter your transactions with advanced criteria
          </Text>
        </Box>

        {/* Search Statistics */}
        {searchStats.transactionCount > 0 && (
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor="gray.200">
              <Stat>
                <StatLabel>Total Transactions</StatLabel>
                <StatNumber>{searchStats.transactionCount}</StatNumber>
              </Stat>
            </Box>
            
            <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor="gray.200">
              <Stat>
                <StatLabel>Total Income</StatLabel>
                <StatNumber color="green.500">
                  {formatCurrency(searchStats.incomeAmount)}
                </StatNumber>
              </Stat>
            </Box>
            
            <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor="gray.200">
              <Stat>
                <StatLabel>Total Expenses</StatLabel>
                <StatNumber color="red.500">
                  {formatCurrency(searchStats.expenseAmount)}
                </StatNumber>
              </Stat>
            </Box>
            
            <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor="gray.200">
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
          isLoading={isLoading}
        />

        {/* Search Results Component */}
        <TransactionSearchResults
          transactions={transactions}
          isLoading={isLoading}
          error={error}
          totalCount={pagination.totalCount}
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onTransactionEdit={handleTransactionEdit}
          onTransactionDelete={handleTransactionDelete}
          onTransactionView={handleTransactionView}
          onExportResults={handleExportResults}
          searchQuery={filters.keyword}
          appliedFilters={filters}
        />

        {/* Transaction Detail Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Transaction Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedTransaction && (
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Description:</Text>
                    <Text>{selectedTransaction.description}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Amount:</Text>
                    <Text
                      color={selectedTransaction.type === 'income' ? 'green.500' : 'red.500'}
                      fontWeight="bold"
                    >
                      {formatCurrency(selectedTransaction.amount)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Date:</Text>
                    <Text>{new Date(selectedTransaction.date).toLocaleDateString()}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Category:</Text>
                    <Text>{selectedTransaction.category?.name || 'Uncategorized'}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Type:</Text>
                    <Text textTransform="capitalize">{selectedTransaction.type}</Text>
                  </HStack>
                  {selectedTransaction.notes && (
                    <VStack align="stretch">
                      <Text fontWeight="semibold">Notes:</Text>
                      <Text>{selectedTransaction.notes}</Text>
                    </VStack>
                  )}
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default TransactionSearch;
