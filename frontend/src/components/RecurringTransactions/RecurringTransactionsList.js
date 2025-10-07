import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Flex,
  Text,
  useDisclosure,
  Spinner,
  Center,
  HStack,
  Tooltip
} from '@chakra-ui/react';
import { FaPause, FaPlay, FaEdit, FaTrash, FaHistory, FaPlus } from 'react-icons/fa';
import { recurringTransactionService } from '../../services/recurringTransactionService';
import RecurringTransactionModal from './RecurringTransactionModal';
import RecurringTransactionHistory from './RecurringTransactionHistory';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';

const RecurringTransactionsList = () => {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecurring, setSelectedRecurring] = useState(null);
  const [historyRecurring, setHistoryRecurring] = useState(null);
  const toast = useToast();
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const response = await recurringTransactionService.getAll();
      setRecurring(response.data.recurring);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch recurring transactions',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRecurring(null);
    onModalOpen();
  };

  const handleEdit = (item) => {
    setSelectedRecurring(item);
    onModalOpen();
  };

  const handlePause = async (id) => {
    try {
      await recurringTransactionService.pause(id);
      toast({
        title: 'Success',
        description: 'Recurring transaction paused',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      fetchRecurring();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to pause recurring transaction',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleResume = async (id) => {
    try {
      await recurringTransactionService.resume(id);
      toast({
        title: 'Success',
        description: 'Recurring transaction resumed',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      fetchRecurring();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resume recurring transaction',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring transaction? This will not delete previously created transactions.')) {
      return;
    }

    try {
      await recurringTransactionService.delete(id);
      toast({
        title: 'Success',
        description: 'Recurring transaction deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      fetchRecurring();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete recurring transaction',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleShowHistory = (item) => {
    setHistoryRecurring(item);
    onHistoryOpen();
  };

  const handleModalClose = () => {
    setSelectedRecurring(null);
    onModalClose();
    fetchRecurring();
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'green',
      paused: 'yellow',
      completed: 'blue',
      cancelled: 'red'
    };
    return <Badge colorScheme={colors[status]}>{status.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type) => {
    return (
      <Badge colorScheme={type === 'income' ? 'green' : 'red'}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFrequency = (frequency) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Text fontSize="2xl" fontWeight="bold" color="gray.700">
              Recurring Transactions
            </Text>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              onClick={handleCreate}
            >
              Add Recurring Transaction
            </Button>
          </Flex>
        </CardHeader>

        <CardBody>
          {recurring.length === 0 ? (
            <Center py={10}>
              <Text color="gray.500" fontSize="lg">
                No recurring transactions found. Create one to get started!
              </Text>
            </Center>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Type</Th>
                    <Th>Category</Th>
                    <Th>Amount</Th>
                    <Th>Frequency</Th>
                    <Th>Next Date</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recurring.map((item) => (
                    <Tr key={item._id}>
                      <Td>{getTypeBadge(item.type)}</Td>
                      <Td fontWeight="medium">{item.category}</Td>
                      <Td fontWeight="bold">
                        {item.currency} {item.amount.toFixed(2)}
                      </Td>
                      <Td>{formatFrequency(item.frequency)}</Td>
                      <Td>{formatDate(item.nextOccurrence)}</Td>
                      <Td>{getStatusBadge(item.status)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          {item.status === 'active' ? (
                            <Tooltip label="Pause">
                              <IconButton
                                icon={<FaPause />}
                                size="sm"
                                colorScheme="orange"
                                onClick={() => handlePause(item._id)}
                                aria-label="Pause"
                              />
                            </Tooltip>
                          ) : item.status === 'paused' ? (
                            <Tooltip label="Resume">
                              <IconButton
                                icon={<FaPlay />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleResume(item._id)}
                                aria-label="Resume"
                              />
                            </Tooltip>
                          ) : null}
                          <Tooltip label="Edit">
                            <IconButton
                              icon={<FaEdit />}
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleEdit(item)}
                              aria-label="Edit"
                            />
                          </Tooltip>
                          <Tooltip label="History">
                            <IconButton
                              icon={<FaHistory />}
                              size="sm"
                              colorScheme="purple"
                              onClick={() => handleShowHistory(item)}
                              aria-label="History"
                            />
                          </Tooltip>
                          <Tooltip label="Delete">
                            <IconButton
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDelete(item._id)}
                              aria-label="Delete"
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <RecurringTransactionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        recurring={selectedRecurring}
      />

      {/* History Modal */}
      {historyRecurring && (
        <RecurringTransactionHistory
          isOpen={isHistoryOpen}
          onClose={onHistoryClose}
          recurring={historyRecurring}
        />
      )}
    </Box>
  );
};

export default RecurringTransactionsList;
