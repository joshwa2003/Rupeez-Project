import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  IconButton,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  HStack,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  Alert,
  AlertIcon,
  Spinner,
  Center
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  ChevronDownIcon,
  CalendarIcon
} from '@chakra-ui/icons';
import { useGroup } from '../../contexts/GroupContext';
import CreateGroupModal from './CreateGroupModal';
import GroupDetailsModal from './GroupDetailsModal';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';

const GroupManager = () => {
  const {
    groups,
    loading,
    error,
    loadGroups,
    deleteGroup,
    selectGroup
  } = useGroup();
  
  // Get user info from localStorage or API
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // You can fetch user data from API here if needed
          // For now, we'll use a simple approach
          setUser({ id: 'current-user' });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);
  const toast = useToast();
  
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose
  } = useDisclosure();
  
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose
  } = useDisclosure();

  // Color mode values
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  useEffect(() => {
    loadGroups();
  }, []);

  const handleDeleteGroup = async (groupId, groupName) => {
    if (window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)) {
      try {
        await deleteGroup(groupId);
        toast({
          title: 'Group deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error deleting group',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    selectGroup(group);
    onDetailsOpen();
  };

  const filteredGroups = groups.filter(group => {
    if (filter === 'active') return group.isActive;
    if (filter === 'inactive') return !group.isActive;
    return true;
  });

  const getMemberDisplayName = (member) => {
    if (member.userId && member.userId.toString() === user?.id) {
      return 'You';
    }
    return member.displayName;
  };

  const getMemberAvatar = (member) => {
    if (member.avatarUrl) {
      return member.avatarUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=random`;
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color={textColor}>Loading groups...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Error loading groups</Text>
          <Text fontSize="sm">{error}</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Group Expense Manager
          </Heading>
          <Text color={textColor}>
            Create and manage groups for splitting expenses with friends
          </Text>
        </Box>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={onCreateOpen}
          size="lg"
        >
          Create Group
        </Button>
      </Flex>

      {/* Filter and Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={textColor}>Total Groups</Text>
                  <Text fontSize="2xl" fontWeight="bold">{groups.length}</Text>
                </VStack>
                <CalendarIcon color="blue.500" boxSize={6} />
              </HStack>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={textColor}>Active Groups</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {groups.filter(g => g.isActive).length}
                  </Text>
                </VStack>
                <CalendarIcon color="green.500" boxSize={6} />
              </HStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Filter Tabs */}
      <HStack spacing={2} mb={6}>
        <Button
          size="sm"
          variant={filter === 'all' ? 'solid' : 'outline'}
          colorScheme="blue"
          onClick={() => setFilter('all')}
        >
          All Groups
        </Button>
        <Button
          size="sm"
          variant={filter === 'active' ? 'solid' : 'outline'}
          colorScheme="green"
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button
          size="sm"
          variant={filter === 'inactive' ? 'solid' : 'outline'}
          colorScheme="gray"
          onClick={() => setFilter('inactive')}
        >
          Inactive
        </Button>
      </HStack>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <Center py={10}>
              <VStack spacing={4}>
                <CalendarIcon boxSize={12} color={textColor} />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                    No groups found
                  </Text>
                  <Text color={textColor} textAlign="center">
                    {filter === 'all' 
                      ? "You haven't created any groups yet. Create your first group to start splitting expenses!"
                      : `No ${filter} groups found.`
                    }
                  </Text>
                </VStack>
                {filter === 'all' && (
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={onCreateOpen}
                  >
                    Create Your First Group
                  </Button>
                )}
              </VStack>
            </Center>
          </CardBody>
        </Card>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
          {filteredGroups.map((group) => (
            <Card
              key={group._id}
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
                bg: hoverBg
              }}
              transition="all 0.2s"
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack>
                      <Heading size="md">{group.name}</Heading>
                      <Badge
                        colorScheme={group.isActive ? 'green' : 'gray'}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {group.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </HStack>
                    {group.description && (
                      <Text fontSize="sm" color={textColor} noOfLines={2}>
                        {group.description}
                      </Text>
                    )}
                  </VStack>
                  
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<ChevronDownIcon />}
                      variant="ghost"
                      size="sm"
                    />
                    <MenuList>
                      <MenuItem icon={<ViewIcon />} onClick={() => handleViewGroup(group)}>
                        View Details
                      </MenuItem>
                      <MenuItem icon={<EditIcon />} isDisabled>
                        Edit Group
                      </MenuItem>
                      <MenuItem 
                        icon={<DeleteIcon />} 
                        color="red.500"
                        onClick={() => handleDeleteGroup(group._id, group.name)}
                      >
                        Delete Group
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </CardHeader>
              
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  {/* Members */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                        Members ({group.members.length})
                      </Text>
                    </HStack>
                    <AvatarGroup size="sm" max={4}>
                      {group.members.slice(0, 4).map((member, index) => (
                        <Tooltip
                          key={index}
                          label={getMemberDisplayName(member)}
                          placement="top"
                        >
                          <Avatar
                            name={member.displayName}
                            src={getMemberAvatar(member)}
                            size="sm"
                          />
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                    {group.members.length > 4 && (
                      <Text fontSize="xs" color={textColor} mt={1}>
                        +{group.members.length - 4} more
                      </Text>
                    )}
                  </Box>

                  {/* Currency */}
                  <HStack justify="space-between">
                    <Text fontSize="sm" color={textColor}>Default Currency</Text>
                    <Badge colorScheme="blue" variant="subtle">
                      {group.defaultCurrency}
                    </Badge>
                  </HStack>

                  {/* Actions */}
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      leftIcon={<ViewIcon />}
                      onClick={() => handleViewGroup(group)}
                      flex={1}
                    >
                      View Details
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
      />
      
      <GroupDetailsModal
        isOpen={isDetailsOpen}
        onClose={onDetailsClose}
        group={selectedGroup}
      />
    </Box>
  );
};

export default GroupManager;
