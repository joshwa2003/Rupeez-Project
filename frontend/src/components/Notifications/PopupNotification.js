import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Flex,
  IconButton,
  useColorModeValue,
  SlideFade,
  CloseButton,
  VStack,
  HStack
} from '@chakra-ui/react';
import { CloseIcon, WarningIcon, CheckCircleIcon, InfoIcon } from '@chakra-ui/icons';
import { useHistory } from 'react-router-dom';

const PopupNotification = ({
  notification,
  onClose,
  onNavigate,
  duration = 5001,
  position = 0
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const history = useHistory();

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Wait for animation
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(notification);
    }
    handleClose();
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'budget_alert':
        return notification.alertType === 'exceeded'
          ? <WarningIcon color="red.500" boxSize={5} />
          : <WarningIcon color="orange.500" boxSize={5} />;
      case 'success':
        return <CheckCircleIcon color="green.500" boxSize={5} />;
      default:
        return <InfoIcon color="blue.500" boxSize={5} />;
    }
  };

  const getPriorityStyles = () => {
    const styles = {
      high: {
        bg: useColorModeValue('red.50', 'red.900'),
        borderColor: 'red.200',
        borderWidth: '2px'
      },
      medium: {
        bg: useColorModeValue('orange.50', 'orange.900'),
        borderColor: 'orange.200',
        borderWidth: '1px'
      },
      low: {
        bg: useColorModeValue('blue.50', 'blue.900'),
        borderColor: 'blue.200',
        borderWidth: '1px'
      }
    };
    return styles[notification.priority] || styles.low;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const priorityStyles = getPriorityStyles();

  return (
    <SlideFade in={isVisible} offsetY="20px" offsetX="20px">
      <Box
        position="relative"
        maxW="400px"
        minW="320px"
        mb={4}
        transform={`translateY(${position * 80}px)`}
        zIndex={1000 - position}
        cursor="pointer"
        onClick={handleClick}
        _hover={{ transform: `translateY(${position * 80}px) scale(1.02)` }}
        transition="all 0.2s ease"
      >
        <Box
          p={4}
          bg={priorityStyles.bg}
          borderRadius="lg"
          border={priorityStyles.borderWidth}
          borderColor={priorityStyles.borderColor}
          boxShadow="xl"
          position="relative"
          overflow="hidden"
        >
          {/* Priority indicator */}
          <Box
            position="absolute"
            left={0}
            top={0}
            bottom={0}
            w="4px"
            bg={
              notification.priority === 'high' ? 'red.400' :
              notification.priority === 'medium' ? 'orange.400' : 'blue.400'
            }
          />

          <Flex align="flex-start" gap={3}>
            {/* Icon */}
            <Box mt={1} flexShrink={0}>
              {getNotificationIcon()}
            </Box>

            {/* Content */}
            <VStack align="stretch" flex={1} spacing={1}>
              <HStack justify="space-between" align="flex-start">
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color={useColorModeValue('gray.800', 'gray.100')}
                  noOfLines={1}
                >
                  {notification.title}
                </Text>
                <CloseButton
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  color={useColorModeValue('gray.500', 'gray.400')}
                />
              </HStack>

              <Text
                fontSize="xs"
                color={useColorModeValue('gray.600', 'gray.300')}
                noOfLines={2}
                lineHeight="1.4"
              >
                {notification.message}
              </Text>

              <HStack justify="space-between" align="center">
                <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                  {formatTimeAgo(notification.timestamp)}
                </Text>

                {notification.type === 'budget_alert' && (
                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                    {notification.category} • {notification.period}
                  </Text>
                )}
              </HStack>
            </VStack>
          </Flex>
        </Box>
      </Box>
    </SlideFade>
  );
};

export default PopupNotification;
