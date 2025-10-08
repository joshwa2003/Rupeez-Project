import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Divider,
  Badge,
  Avatar,
  AvatarGroup,
  Button,
  Flex,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Tooltip
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  CheckIcon,
  CloseIcon,
  CalendarIcon
} from '@chakra-ui/icons';
import { useGroup } from '../../contexts/GroupContext';
import AddExpenseModal from './AddExpenseModal';
import SettlementModal from './SettlementModal';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';

const GroupDetailsModal = ({ isOpen, onClose, group }) => {
  const {
    groupExpenses,
    groupBalances,
    settlements,
    settlementSuggestions,
    loading,
    loadGroupExpenses,
    loadGroupBalances,
    loadSettlementSuggestions,
    loadSettlements,
    completeSettlement
  } = useGroup();
  
  // Get user info from localStorage
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ id: 'current-user' });
    }
  }, []);
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState(0);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    if (isOpen && group) {
      loadGroupExpenses(group._id);
      loadGroupBalances(group._id);
      loadSettlementSuggestions(group._id);
      loadSettlements(group._id);
    }
  }, [isOpen, group]);

  const getMemberDisplayName = (memberId) => {
    if (!group) return memberId;
    
    const member = group.members.find(m => {
      if (memberId.startsWith('u_')) {
        const userId = memberId.replace('u_', '');
        return m.userId && m.userId.toString() === userId;
      } else if (memberId.startsWith('f_')) {
        const friendId = memberId.replace('f_', '');
        return m.friendId && m.friendId.toString() === friendId;
      }
      return false;
    });
    
    if (member) {
      if (member.userId && member.userId.toString() === user?.id) {
        return 'You';
      }
      return member.displayName;
    }
    
    return memberId;
  };

  const getMemberAvatar = (memberId) => {
    if (!group) return null;
    
    const member = group.members.find(m => {
      if (memberId.startsWith('u_')) {
        const userId = memberId.replace('u_', '');
        return m.userId && m.userId.toString() === userId;
      } else if (memberId.startsWith('f_')) {
        const friendId = memberId.replace('f_', '');
        return m.friendId && m.friendId.toString() === friendId;
      }
      return false;
    });
    
    if (member && member.avatarUrl) {
      return member.avatarUrl;
    }
    
    const displayName = getMemberDisplayName(memberId);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  };

  const handleCompleteSettlement = async (settlementId) => {
    try {
      await completeSettlement(group._id, settlementId);
      toast({
        title: 'Settlement completed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Reload data
      loadGroupBalances(group._id);
      loadSettlements(group._id);
    } catch (error) {
      toast({
        title: 'Error completing settlement',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatCurrency = (amount, currency = group?.defaultCurrency) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!group) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
        <ModalOverlay />
        <ModalContent bg={bg} maxH="90vh">
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text fontSize="xl" fontWeight="bold">
                  {group.name}
                </Text>
                <Badge
                  colorScheme={group.isActive ? 'green' : 'gray'}
                  variant="subtle"
                >
                  {group.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </HStack>
              {group.description && (
                <Text fontSize="sm" color={textColor}>
                  {group.description}
                </Text>
              )}
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Expenses</Tab>
                <Tab>Balances</Tab>
                <Tab>Settlements</Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    {/* Group Info */}
                    <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                      <CardHeader>
                        <Text fontSize="lg" fontWeight="semibold">
                          Group Information
                        </Text>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Text color={textColor}>Default Currency</Text>
                            <Badge colorScheme="blue" variant="subtle">
                              {group.defaultCurrency}
                            </Badge>
                          </HStack>
                          
                          <HStack justify="space-between">
                            <Text color={textColor}>Total Members</Text>
                            <Text fontWeight="semibold">{group.members.length}</Text>
                          </HStack>
                          
                          <HStack justify="space-between">
                            <Text color={textColor}>Total Expenses</Text>
                            <Text fontWeight="semibold">{groupExpenses.length}</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Members */}
                    <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                      <CardHeader>
                        <Text fontSize="lg" fontWeight="semibold">
                          Members
                        </Text>
                      </CardHeader>
                      <CardBody>
                        <AvatarGroup size="md" max={10}>
                          {group.members.map((member, index) => (
                            <Tooltip
                              key={index}
                              label={member.userId && member.userId.toString() === user?.id ? 'You' : member.displayName}
                              placement="top"
                            >
                              <Avatar
                                name={member.displayName}
                                src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=random`}
                              />
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      </CardBody>
                    </Card>

                    {/* Quick Actions */}
                    <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                      <CardHeader>
                        <Text fontSize="lg" fontWeight="semibold">
                          Quick Actions
                        </Text>
                      </CardHeader>
                      <CardBody>
                        <HStack spacing={4}>
                          <Button
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            onClick={() => setIsAddExpenseOpen(true)}
                          >
                            Add Expense
                          </Button>
                          <Button
                            leftIcon={<CalendarIcon />}
                            colorScheme="green"
                            onClick={() => setIsSettlementOpen(true)}
                          >
                            Settle Up
                          </Button>
                        </HStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>

                {/* Expenses Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Text fontSize="lg" fontWeight="semibold">
                        Recent Expenses
                      </Text>
                      <Button
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        size="sm"
                        onClick={() => setIsAddExpenseOpen(true)}
                      >
                        Add Expense
                      </Button>
                    </Flex>

                    {loading ? (
                      <Center py={8}>
                        <Spinner size="lg" color="blue.500" />
                      </Center>
                    ) : groupExpenses.length === 0 ? (
                      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                        <CardBody>
                          <Center py={8}>
                            <VStack spacing={4}>
                              <CalendarIcon boxSize={12} color={textColor} />
                              <VStack spacing={2}>
                                <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                                  No expenses yet
                                </Text>
                                <Text color={textColor} textAlign="center">
                                  Start by adding your first expense to the group
                                </Text>
                              </VStack>
                              <Button
                                leftIcon={<AddIcon />}
                                colorScheme="blue"
                                onClick={() => setIsAddExpenseOpen(true)}
                              >
                                Add First Expense
                              </Button>
                            </VStack>
                          </Center>
                        </CardBody>
                      </Card>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Date</Th>
                              <Th>Description</Th>
                              <Th>Paid By</Th>
                              <Th>Amount</Th>
                              <Th>Category</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {groupExpenses.slice(0, 10).map((expense) => (
                              <Tr key={expense._id}>
                                <Td>{formatDate(expense.date)}</Td>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium" noOfLines={1}>
                                      {expense.notes || 'No description'}
                                    </Text>
                                    <Text fontSize="xs" color={textColor}>
                                      {expense.splitType} split
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <HStack>
                                    <Avatar
                                      size="xs"
                                      name={getMemberDisplayName(expense.paidBy)}
                                      src={getMemberAvatar(expense.paidBy)}
                                    />
                                    <Text fontSize="sm">
                                      {getMemberDisplayName(expense.paidBy)}
                                    </Text>
                                  </HStack>
                                </Td>
                                <Td fontWeight="semibold">
                                  {formatCurrency(expense.amount, expense.currency)}
                                </Td>
                                <Td>
                                  <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                                    {expense.category}
                                  </Badge>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Balances Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="lg" fontWeight="semibold">
                      Member Balances
                    </Text>

                    {loading ? (
                      <Center py={8}>
                        <Spinner size="lg" color="blue.500" />
                      </Center>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {groupBalances.map((balance) => {
                          const isOwed = balance.balanceBase > 0.01;
                          const isOwing = balance.balanceBase < -0.01;
                          const amount = Math.abs(balance.balanceBase);
                          
                          return (
                            <Card
                              key={balance.memberId}
                              bg={cardBg}
                              border="1px solid"
                              borderColor={borderColor}
                            >
                              <CardBody>
                                <HStack justify="space-between">
                                  <HStack>
                                    <Avatar
                                      size="sm"
                                      name={getMemberDisplayName(balance.memberId)}
                                      src={getMemberAvatar(balance.memberId)}
                                    />
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium">
                                        {getMemberDisplayName(balance.memberId)}
                                      </Text>
                                      <Text fontSize="xs" color={textColor}>
                                        {isOwed ? 'Others owe them' : isOwing ? 'They owe others' : 'Settled up'}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  
                                  <VStack align="end" spacing={0}>
                                    <Text
                                      fontSize="lg"
                                      fontWeight="bold"
                                      color={isOwed ? 'green.500' : isOwing ? 'red.500' : 'gray.500'}
                                    >
                                      {isOwed ? '+' : isOwing ? '-' : ''}
                                      {formatCurrency(amount)}
                                    </Text>
                                    <Badge
                                      colorScheme={isOwed ? 'green' : isOwing ? 'red' : 'gray'}
                                      variant="subtle"
                                      fontSize="xs"
                                    >
                                      {isOwed ? 'Owed' : isOwing ? 'Owing' : 'Settled'}
                                    </Badge>
                                  </VStack>
                                </HStack>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </VStack>
                    )}
                  </VStack>
                </TabPanel>

                {/* Settlements Tab */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Text fontSize="lg" fontWeight="semibold">
                        Settlements
                      </Text>
                      <Button
                        leftIcon={<CalendarIcon />}
                        colorScheme="green"
                        size="sm"
                        onClick={() => setIsSettlementOpen(true)}
                      >
                        Settle Up
                      </Button>
                    </Flex>

                    {/* Settlement Suggestions */}
                    {settlementSuggestions.length > 0 && (
                      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                        <CardHeader>
                          <Text fontSize="md" fontWeight="semibold" color="green.600">
                            Settlement Suggestions
                          </Text>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            {settlementSuggestions.map((suggestion, index) => (
                              <HStack
                                key={index}
                                p={3}
                                bg={useColorModeValue('green.50', 'green.900')}
                                borderRadius="md"
                                justify="space-between"
                              >
                                <HStack>
                                  <Avatar
                                    size="sm"
                                    name={getMemberDisplayName(suggestion.fromMemberId)}
                                    src={getMemberAvatar(suggestion.fromMemberId)}
                                  />
                                  <Text>should pay</Text>
                                  <Avatar
                                    size="sm"
                                    name={getMemberDisplayName(suggestion.toMemberId)}
                                    src={getMemberAvatar(suggestion.toMemberId)}
                                  />
                                </HStack>
                                <Text fontWeight="bold" color="green.600">
                                  {formatCurrency(suggestion.amount)}
                                </Text>
                              </HStack>
                            ))}
                          </VStack>
                        </CardBody>
                      </Card>
                    )}

                    {/* Settlement History */}
                    {loading ? (
                      <Center py={8}>
                        <Spinner size="lg" color="blue.500" />
                      </Center>
                    ) : settlements.length === 0 ? (
                      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                        <CardBody>
                          <Center py={8}>
                            <VStack spacing={4}>
                              <CalendarIcon boxSize={12} color={textColor} />
                              <VStack spacing={2}>
                                <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                                  No settlements yet
                                </Text>
                                <Text color={textColor} textAlign="center">
                                  Settle up with your group members to clear outstanding balances
                                </Text>
                              </VStack>
                            </VStack>
                          </Center>
                        </CardBody>
                      </Card>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {settlements.map((settlement) => (
                          <Card
                            key={settlement._id}
                            bg={cardBg}
                            border="1px solid"
                            borderColor={borderColor}
                          >
                            <CardBody>
                              <HStack justify="space-between">
                                <HStack>
                                  <Avatar
                                    size="sm"
                                    name={getMemberDisplayName(settlement.fromMemberId)}
                                    src={getMemberAvatar(settlement.fromMemberId)}
                                  />
                                  <Text>paid</Text>
                                  <Avatar
                                    size="sm"
                                    name={getMemberDisplayName(settlement.toMemberId)}
                                    src={getMemberAvatar(settlement.toMemberId)}
                                  />
                                  <Text fontWeight="semibold">
                                    {formatCurrency(settlement.amount)}
                                  </Text>
                                </HStack>
                                
                                <HStack>
                                  <Badge
                                    colorScheme={
                                      settlement.status === 'completed' ? 'green' :
                                      settlement.status === 'pending' ? 'yellow' : 'red'
                                    }
                                    variant="subtle"
                                  >
                                    {settlement.status}
                                  </Badge>
                                  
                                  {settlement.status === 'pending' && (
                                    <IconButton
                                      icon={<CheckIcon />}
                                      size="sm"
                                      colorScheme="green"
                                      variant="ghost"
                                      onClick={() => handleCompleteSettlement(settlement._id)}
                                      aria-label="Complete settlement"
                                    />
                                  )}
                                </HStack>
                              </HStack>
                              
                              {settlement.notes && (
                                <Text fontSize="sm" color={textColor} mt={2}>
                                  {settlement.notes}
                                </Text>
                              )}
                              
                              <Text fontSize="xs" color={textColor} mt={2}>
                                {formatDate(settlement.createdAt)}
                              </Text>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Sub-modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        group={group}
      />
      
      <SettlementModal
        isOpen={isSettlementOpen}
        onClose={() => setIsSettlementOpen(false)}
        group={group}
        suggestions={settlementSuggestions}
      />
    </>
  );
};

export default GroupDetailsModal;
