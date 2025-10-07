import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import { WarningIcon, CheckCircleIcon, InfoIcon } from '@chakra-ui/icons';

const NotificationItem = ({ notification, onClick, onMarkAsRead }) => {
  const bgColor = useColorModeValue(
    notification.isRead ? 'gray.50' : 'white',
    notification.isRead ? 'gray.700' : 'gray.600'
  );
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'budget_alert':
        return notification.alertType === 'exceeded' 
          ? <WarningIcon color="red.500" />
          : <WarningIcon color="orange.500" />;
      case 'success':
        return <CheckCircleIcon color="green.500" />;
      default:
        return <InfoIcon color="blue.500" />;
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'blue'
    };
    
    return (
      <Badge 
        colorScheme={colors[notification.priority]} 
        size="sm"
        variant={notification.isRead ? 'outline' : 'solid'}
      >
        {notification.priority}
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <Box
      p={3}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        bg: useColorModeValue('gray.100', 'gray.500'),
        transform: 'translateY(-1px)',
        shadow: 'sm'
      }}
      onClick={handleClick}
      position="relative"
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <Box
          position="absolute"
          left={1}
          top="50%"
          transform="translateY(-50%)"
          w={2}
          h={2}
          bg="blue.500"
          borderRadius="full"
        />
      )}

      <Flex align="flex-start" gap={3}>
        {/* Icon */}
        <Box mt={1}>
          {getNotificationIcon()}
        </Box>

        {/* Content */}
        <Box flex={1} minW={0}>
          <Flex justify="space-between" align="flex-start" mb={1}>
            <Text
              fontSize="sm"
              fontWeight={notification.isRead ? 'normal' : 'semibold'}
              color={textColor}
              noOfLines={1}
            >
              {notification.title}
            </Text>
            {getPriorityBadge()}
          </Flex>

          <Text
            fontSize="xs"
            color={mutedTextColor}
            mb={2}
            noOfLines={2}
          >
            {notification.message}
          </Text>

          <Flex justify="space-between" align="center">
            <Text fontSize="xs" color={mutedTextColor}>
              {formatTimeAgo(notification.timestamp)}
            </Text>
            
            {notification.type === 'budget_alert' && (
              <Text fontSize="xs" color={mutedTextColor}>
                {notification.category} • {notification.period}
              </Text>
            )}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default NotificationItem;
