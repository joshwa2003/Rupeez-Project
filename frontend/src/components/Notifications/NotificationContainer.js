import React from 'react';
import { Box } from '@chakra-ui/react';
import PopupNotification from './PopupNotification';

const NotificationContainer = ({
  notifications,
  onClose,
  onNavigate,
  maxNotifications = 5
}) => {
  // Only show popup notifications for high priority items
  const popupNotifications = notifications
    .filter(notification => notification.priority === 'high')
    .slice(0, maxNotifications);

  if (popupNotifications.length === 0) {
    return null;
  }

  return (
    <Box
      position="fixed"
      top="80px"
      right="20px"
      zIndex={9999}
      pointerEvents="none"
    >
      {popupNotifications.map((notification, index) => (
        <Box
          key={notification.id}
          pointerEvents="auto"
          position="relative"
        >
          <PopupNotification
            notification={notification}
            onClose={onClose}
            onNavigate={onNavigate}
            position={index}
            duration={6000} // 6 seconds for high priority notifications
          />
        </Box>
      ))}
    </Box>
  );
};

export default NotificationContainer;
