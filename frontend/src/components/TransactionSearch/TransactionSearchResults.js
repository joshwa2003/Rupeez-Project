import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Avatar,
  Tooltip,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { 
  ChevronDownIcon, 
  EditIcon, 
  DeleteIcon, 
  ExternalLinkIcon,
  DownloadIcon,
  ViewIcon
} from '@chakra-ui/icons';
import { format } from 'date-fns';

const TransactionSearchResults = ({
  transactions = [],
  isLoading = false,
  error = null,
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onTransactionEdit,
  onTransactionDelete,
  onTransactionView,
  onExportResults,
  searchQuery = '',
  appliedFilters = {}
}) => {
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Get transaction type color
  const getTransactionTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'income':
        return 'green';
      case 'expense':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Highlight search terms in text
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Box as="span" key={index} bg="yellow.200" color="black" px={1} borderRadius="sm">
          {part}
        </Box>
      ) : part
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={8}
        textAlign="center"
      >
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color={mutedColor}>Searching transactions...</Text>
        </VStack>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <Text>{error}</Text>
      </Alert>
    );
  }

  // Empty state
  if (!transactions.length) {
    return (
      <Box
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={8}
        textAlign="center"
      >
        <VStack spacing={4}>
          <Text fontSize="lg" fontWeight="semibold" color={textColor}>
            No transactions found
          </Text>
          <Text color={mutedColor}>
            {searchQuery || Object.keys(appliedFilters).length > 0
              ? "Try adjusting your search criteria or filters"
              : "Start by adding some transactions or use the search filters above"
            }
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Results Header */}
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="semibold" color={textColor}>
              Search Results
            </Text>
            <Text fontSize="sm" color={mutedColor}>
              Showing {startIndex}-{endIndex} of {totalCount} transactions
            </Text>
          </VStack>

          <HStack spacing={3}>
            {/* Page Size Selector */}
            <HStack spacing={2}>
              <Text fontSize="sm" color={mutedColor}>Show:</Text>
              <Select
                size="sm"
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
                w="auto"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Select>
            </HStack>

            {/* Export Button */}
            <Button
              size="sm"
              leftIcon={<DownloadIcon />}
              onClick={onExportResults}
              variant="outline"
            >
              Export
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Results Table */}
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Amount</Th>
              <Th>Type</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {transactions.map((transaction) => (
              <Tr key={transaction.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                <Td>
                  <Text fontSize="sm">
                    {formatDate(transaction.date)}
                  </Text>
                </Td>
                
                <Td>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">
                      {highlightSearchTerm(transaction.description, searchQuery)}
                    </Text>
                    {transaction.notes && (
                      <Text fontSize="xs" color={mutedColor} noOfLines={1}>
                        {highlightSearchTerm(transaction.notes, searchQuery)}
                      </Text>
                    )}
                  </VStack>
                </Td>
                
                <Td>
                  {transaction.category && (
                    <HStack spacing={2}>
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={transaction.category.color || 'blue.500'}
                      />
                      <Text fontSize="sm">{transaction.category.name}</Text>
                    </HStack>
                  )}
                </Td>
                
                <Td>
                  <Text
                    fontWeight="semibold"
                    color={transaction.type === 'income' ? 'green.500' : 'red.500'}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </Text>
                </Td>
                
                <Td>
                  <Badge
                    colorScheme={getTransactionTypeColor(transaction.type)}
                    variant="subtle"
                  >
                    {transaction.type}
                  </Badge>
                </Td>
                
                <Td>
                  <HStack spacing={1}>
                    <Tooltip label="View Details">
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<ViewIcon />}
                        onClick={() => onTransactionView?.(transaction)}
                      />
                    </Tooltip>
                    
                    <Tooltip label="Edit Transaction">
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<EditIcon />}
                        onClick={() => onTransactionEdit?.(transaction)}
                      />
                    </Tooltip>
                    
                    <Tooltip label="Delete Transaction">
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        icon={<DeleteIcon />}
                        onClick={() => onTransactionDelete?.(transaction)}
                      />
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box p={4} borderTop="1px" borderColor={borderColor}>
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color={mutedColor}>
              Page {currentPage} of {totalPages}
            </Text>
            
            <HStack spacing={2}>
              <Button
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                isDisabled={currentPage <= 1}
              >
                Previous
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? "solid" : "outline"}
                    onClick={() => onPageChange?.(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                isDisabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default TransactionSearchResults;
