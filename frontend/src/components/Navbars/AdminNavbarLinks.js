import { BellIcon } from "@chakra-ui/icons";
// Chakra Imports
import {
  Avatar,
  Box, Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList, Stack, Text, useColorMode,
  useColorModeValue,
  Badge,
  Divider,
  Spinner,
  VStack,
  HStack
} from "@chakra-ui/react";
// Custom Icons
import { ProfileIcon, SettingsIcon } from "components/Icons/Icons";
// Custom Components
import { SearchBar } from "components/Navbars/SearchBar/SearchBar";
import { SidebarResponsive } from "components/Sidebar/Sidebar";
import NotificationItem from "components/Notifications/NotificationItem";
import { useNotifications } from "contexts/NotificationContext";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { NavLink, useHistory } from "react-router-dom";
import routes from "routes.js";
import { isAuthenticated, getUser, setAuthToken, profileUpdateEvent } from "services/api.js";
import { useAuth } from "../../contexts/AuthContext";

const HeaderLinks = React.memo(function HeaderLinks(props) {
  const {
    variant,
    children,
    fixed,
    scrolled,
    secondary,
    onOpen,
    ...rest
  } = props;

  const { colorMode } = useColorMode();
  const { user: currentUser, authenticated: isLoggedIn, logout } = useAuth();
  const history = useHistory();
  
  // Use notifications context
  const { 
    notifications, 
    unreadCount, 
    isLoading: notificationsLoading, 
    markAsRead, 
    markAllAsRead,
    refreshNotifications 
  } = useNotifications();

  // Memoize the logout handler to prevent re-renders
  const handleLogout = useCallback(() => {
    logout();
    history.push('/auth/signup');
  }, [logout, history]);

  // Handle notification click navigation
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'budget_alert':
        history.push('/admin/budgets');
        break;
      default:
        console.log('No navigation defined for notification type:', notification.type);
    }
  }, [markAsRead, history]);

  // Memoize color values to prevent unnecessary re-renders
  const navbarIcon = useMemo(() => {
    if (secondary) return "white";
    return fixed && scrolled
      ? useColorModeValue("gray.700", "gray.200")
      : useColorModeValue("white", "gray.200");
  }, [fixed, scrolled, secondary]);
  
  const menuBg = useColorModeValue("white", "navy.800");
  return (
    <Flex
      pe={{ sm: "0px", md: "16px" }}
      w={{ sm: "100%", md: "auto" }}
      alignItems='center'
      flexDirection='column'>
      {/* Mobile View - Top Section: Profile, Name, Hamburger, Settings, Notification */}
      <Flex
        display={{ base: "flex", md: "none" }}
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        mb="8px"
        px="4px"
      >
        {isLoggedIn && currentUser ? (
          <>
            {/* Left side: Profile pic and name */}
            <Flex alignItems="center" flex="1">
              <Avatar
                size="sm"
                name={currentUser.name || currentUser.email}
                src={currentUser.profilePicture || currentUser.avatar || undefined}
                me="8px"
              />
              <Text color={navbarIcon} fontSize="sm" fontWeight="medium" noOfLines={1}>
                {currentUser.name || currentUser.email}
              </Text>
            </Flex>
            
            {/* Right side: Hamburger, Settings, Notification */}
            <Flex alignItems="center" gap="12px">
              <SidebarResponsive
                hamburgerColor={navbarIcon}
                logo={
                  <Text
                    fontSize='24px'
                    fontWeight='bold'
                    color={colorMode === "dark" ? "white" : "gray.700"}
                    textAlign='center'
                  >
                    Rupeez
                  </Text>
                }
                colorMode={colorMode}
                secondary={props.secondary}
                routes={routes}
                {...rest}
              />
              
              <Menu>
                <MenuButton>
                  <SettingsIcon
                    cursor="pointer"
                    color={navbarIcon}
                    w="18px"
                    h="18px"
                  />
                </MenuButton>
                <MenuList bg={menuBg} p="8px">
                  <MenuItem borderRadius="8px" mb="4px">
                    <NavLink to="/admin/profile" style={{ width: "100%" }}>
                      <Flex alignItems="center">
                        <ProfileIcon
                          color={useColorModeValue("gray.700", "white")}
                          w="16px"
                          h="16px"
                          me="8px"
                        />
                        <Text fontSize="sm">Profile</Text>
                      </Flex>
                    </NavLink>
                  </MenuItem>
                  <MenuItem
                    borderRadius="8px"
                    onClick={handleLogout}
                  >
                    <Flex alignItems="center">
                      <Box w="16px" h="16px" me="8px">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                        </svg>
                      </Box>
                      <Text fontSize="sm">Logout</Text>
                    </Flex>
                  </MenuItem>
                </MenuList>
              </Menu>
              
              <Menu>
                <MenuButton position="relative">
                  <BellIcon color={navbarIcon} w="18px" h="18px" />
                  {unreadCount > 0 && (
                    <Badge
                      position="absolute"
                      top="-8px"
                      right="-8px"
                      colorScheme="red"
                      borderRadius="full"
                      fontSize="xs"
                      minW="18px"
                      h="18px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </MenuButton>
                <MenuList p="0" bg={menuBg} maxW="350px" w="350px">
                  <Box p="16px 16px 8px 16px">
                    <HStack justify="space-between" align="center">
                      <Text fontSize="md" fontWeight="semibold">
                        Notifications
                      </Text>
                      {notifications.length > 0 && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={markAllAsRead}
                          fontSize="xs"
                        >
                          Mark all read
                        </Button>
                      )}
                    </HStack>
                  </Box>
                  
                  <Divider />
                  
                  <Box maxH="400px" overflowY="auto">
                    {notificationsLoading ? (
                      <Flex justify="center" p="20px">
                        <Spinner size="sm" />
                      </Flex>
                    ) : notifications.length > 0 ? (
                      <VStack spacing={0} align="stretch">
                        {notifications.slice(0, 10).map((notification) => (
                          <Box key={notification.id} p="8px 16px">
                            <NotificationItem
                              notification={notification}
                              onMarkAsRead={markAsRead}
                              onClick={handleNotificationClick}
                            />
                          </Box>
                        ))}
                        {notifications.length > 10 && (
                          <Box p="12px 16px" textAlign="center">
                            <Text fontSize="xs" color="gray.500">
                              +{notifications.length - 10} more notifications
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    ) : (
                      <Box p="20px" textAlign="center">
                        <Text fontSize="sm" color="gray.500">
                          No notifications
                        </Text>
                      </Box>
                    )}
                  </Box>
                  
                  {notifications.length > 0 && (
                    <>
                      <Divider />
                      <Box p="12px 16px" textAlign="center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={refreshNotifications}
                          fontSize="xs"
                          w="full"
                        >
                          Refresh
                        </Button>
                      </Box>
                    </>
                  )}
                </MenuList>
              </Menu>
            </Flex>
          </>
        ) : (
          <>
            <Text color={navbarIcon} fontSize="sm" fontWeight="medium">
              Welcome
            </Text>
            <Flex alignItems="center" gap="12px">
              <SidebarResponsive
                hamburgerColor={navbarIcon}
                logo={
                  <Text
                    fontSize='24px'
                    fontWeight='bold'
                    color={colorMode === "dark" ? "white" : "gray.700"}
                    textAlign='center'
                  >
                    Rupeez
                  </Text>
                }
                colorMode={colorMode}
                secondary={props.secondary}
                routes={routes}
                {...rest}
              />
              <NavLink to="/auth/signin">
                <Button
                  ms="0px"
                  px="8px"
                  color={navbarIcon}
                  variant="no-effects"
                  fontSize="sm"
                >
                  Sign In
                </Button>
              </NavLink>
            </Flex>
          </>
        )}
      </Flex>
      
      {/* Mobile View - Bottom Section: Search Bar */}
      <Flex display={{ base: "flex", md: "none" }} w="100%" px="4px">
        <SearchBar w="100%" />
      </Flex>
      
      {/* Desktop/Tablet View - Original Layout */}
      <Flex display={{ base: "none", md: "flex" }} alignItems="center">
        {isLoggedIn && currentUser ? (
          <Menu>
            <MenuButton me={{ sm: "2px", md: "16px" }}>
              <Flex alignItems="center" cursor="pointer">
                <Avatar
                  size="sm"
                  name={currentUser.name || currentUser.email}
                  src={currentUser.profilePicture || currentUser.avatar || undefined}
                  me="8px"
                />
                <Text
                  color={navbarIcon}
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {currentUser.name || currentUser.email}
                </Text>
              </Flex>
            </MenuButton>
            <MenuList bg={menuBg} p="8px">
              <MenuItem borderRadius="8px" mb="4px">
                <NavLink to="/admin/profile" style={{ width: "100%" }}>
                  <Flex alignItems="center">
                    <ProfileIcon color={useColorModeValue("gray.700", "white")} w="16px" h="16px" me="8px" />
                    <Text fontSize="sm">Profile</Text>
                  </Flex>
                </NavLink>
              </MenuItem>
            <MenuItem 
              borderRadius="8px" 
              onClick={handleLogout}
            >
                <Flex alignItems="center">
                  <Box w="16px" h="16px" me="8px">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                  </Box>
                  <Text fontSize="sm">Logout</Text>
                </Flex>
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <NavLink to='/auth/signin'>
            <Button
              ms='0px'
              px='0px'
              me={{ sm: "2px", md: "16px" }}
              color={navbarIcon}
              variant='no-effects'
              rightIcon={
                document.documentElement.dir ? (
                  ""
                ) : (
                  <ProfileIcon color={navbarIcon} w='22px' h='22px' me='0px' />
                )
              }
              leftIcon={
                document.documentElement.dir ? (
                  <ProfileIcon color={navbarIcon} w='22px' h='22px' me='0px' />
                ) : (
                  ""
                )
              }>
              <Text>Sign In</Text>
            </Button>
          </NavLink>
        )}
        
        <SidebarResponsive
          hamburgerColor={"white"}
          logo={
            <Text
              fontSize='24px'
              fontWeight='bold'
              color={colorMode === "dark" ? "white" : "gray.700"}
              textAlign='center'
            >
              Rupeez
            </Text>
          }
          colorMode={colorMode}
          secondary={props.secondary}
          routes={routes}
          {...rest}
        />
        
        <SettingsIcon
          cursor='pointer'
          ms={{ base: "16px", xl: "0px" }}
          me='16px'
          onClick={props.onOpen}
          color={navbarIcon}
          w='18px'
          h='18px'
        />
        
        <Menu>
          <MenuButton position="relative">
            <BellIcon color={navbarIcon} w='18px' h='18px' />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="-8px"
                right="-8px"
                colorScheme="red"
                borderRadius="full"
                fontSize="xs"
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </MenuButton>
          <MenuList p="0" bg={menuBg} maxW="350px" w="350px">
            <Box p="16px 16px 8px 16px">
              <HStack justify="space-between" align="center">
                <Text fontSize="md" fontWeight="semibold">
                  Notifications
                </Text>
                {notifications.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={markAllAsRead}
                    fontSize="xs"
                  >
                    Mark all read
                  </Button>
                )}
              </HStack>
            </Box>
            
            <Divider />
            
            <Box maxH="400px" overflowY="auto">
              {notificationsLoading ? (
                <Flex justify="center" p="20px">
                  <Spinner size="sm" />
                </Flex>
              ) : notifications.length > 0 ? (
                <VStack spacing={0} align="stretch">
                  {notifications.slice(0, 10).map((notification) => (
                    <Box key={notification.id} p="8px 16px">
                      <NotificationItem
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onClick={handleNotificationClick}
                      />
                    </Box>
                  ))}
                  {notifications.length > 10 && (
                    <Box p="12px 16px" textAlign="center">
                      <Text fontSize="xs" color="gray.500">
                        +{notifications.length - 10} more notifications
                      </Text>
                    </Box>
                  )}
                </VStack>
              ) : (
                <Box p="20px" textAlign="center">
                  <Text fontSize="sm" color="gray.500">
                    No notifications
                  </Text>
                </Box>
              )}
            </Box>
            
            {notifications.length > 0 && (
              <>
                <Divider />
                <Box p="12px 16px" textAlign="center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={refreshNotifications}
                    fontSize="xs"
                    w="full"
                  >
                    Refresh
                  </Button>
                </Box>
              </>
            )}
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
});

export default HeaderLinks;
