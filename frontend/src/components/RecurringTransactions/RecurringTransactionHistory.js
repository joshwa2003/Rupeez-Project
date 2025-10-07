import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Center,
  Spinner,
  Box,
  HStack,
  Button
} from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { recurringTransactionService } from '../../services/recurringTransactionService';

const RecurringTransactionHistory = ({ isOpen, onClose, recurring }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    if (isOpen && recurring) {
      fetchHistory(1);
    }
  }, [isOpen, recurring]);

  const fetchHistory = async (page) => {
    try {
      setLoading(true);
      const response = await recurringTransactionService.getHistory(recurring._id, page, 10);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'green',
      pending: 'yellow',
      cancelled: 'red'
    };
    return <Badge colorScheme={colors[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Transaction History - {recurring?.category}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          {loading ? (
            <Center py={10}>
              <Spinner size="xl" color="blue.500" />
            </Center>
          ) : transactions.length === 0 ? (
            <Center py={10}>
              <Text color="gray.500">No transactions created yet</Text>
            </Center>
          ) : (
            <>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Amount</Th>
                      <Th>Payment Method</Th>
                      <Th>Status</Th>
                      <Th>Notes</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transactions.map((transaction) => (
                      <Tr key={transaction._id}>
                        <Td>{formatDate(transaction.date)}</Td>
                        <Td fontWeight="bold">
                          {transaction.currency} {transaction.amount.toFixed(2)}
                        </Td>
                        <Td>{transaction.paymentMethod}</Td>
                        <Td>{getStatusBadge(transaction.status)}</Td>
                        <Td>
                          <Text noOfLines={1} maxW="200px">
                            {transaction.notes || '-'}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <HStack justify="center" mt={4} spacing={4}>
                  <Button
                    size="sm"
                    leftIcon={<FaChevronLeft />}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    isDisabled={pagination.currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Text>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </Text>
                  <Button
                    size="sm"
                    rightIcon={<FaChevronRight />}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    isDisabled={pagination.currentPage === pagination.totalPages}
                  >
                    Next
                  </Button>
                </HStack>
              )}

              <Text fontSize="sm" color="gray.500" mt={4} textAlign="center">
                Total: {pagination.totalItems} transaction(s)
              </Text>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RecurringTransactionHistory;
