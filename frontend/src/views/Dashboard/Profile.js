// Chakra imports
import {
  Avatar,
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  Input,
  FormControl,
  FormLabel,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";
// Custom components
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaLock,
  FaSignOutAlt,
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import axios from "axios";
import { dispatchProfileUpdate } from "services/api.js";

function Profile() {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // State management
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: null
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Chakra color mode
  const textColor = useColorModeValue("gray.700", "white");
  const iconColor = useColorModeValue("blue.500", "white");
  const bgProfile = useColorModeValue("hsla(0,0%,100%,.8)", "navy.800");
  const borderProfileColor = useColorModeValue("white", "transparent");
  const emailColor = useColorModeValue("gray.400", "gray.300");

  // Load user data on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5001/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        const userData = response.data.data.user;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          profilePicture: userData.profilePicture || null
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('File size too large. Maximum size is 5MB.');
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          status: "error",
          duration: 5001,
          isClosable: true,
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
        toast({
          title: "Invalid File Type",
          description: "Please select a JPG, PNG, GIF, or WebP image.",
          status: "error",
          duration: 5001,
          isClosable: true,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
      };
      reader.onerror = () => {
        setError('Failed to read the selected file.');
        toast({
          title: "File Read Error",
          description: "Failed to read the selected file. Please try again.",
          status: "error",
          duration: 5001,
          isClosable: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5001/api/users/profile', {
        name: formData.name,
        phone: formData.phone,
        profilePicture: formData.profilePicture
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        setIsEditing(false);
        
        // Dispatch profile update event to update navbar
        dispatchProfileUpdate(updatedUser);
        
        toast({
          title: "Profile Updated!",
          description: "Your profile has been updated successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      toast({
        title: "Update Failed",
        description: errorMessage,
        status: "error",
        duration: 5001,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5001/api/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        toast({
          title: "Password Changed!",
          description: "Your password has been changed successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      setError(errorMessage);
      toast({
        title: "Password Change Failed",
        description: errorMessage,
        status: "error",
        duration: 5001,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/auth/logout-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      toast({
        title: "Logged Out",
        description: "You have been logged out from all devices.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/#/auth/signin';
      }, 1000);
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to logout from all devices.",
        status: "error",
        duration: 5001,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Flex direction='column' pt={{ base: "120px", md: "75px", lg: "100px" }} align="center" justify="center">
        <Text>Loading profile...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction='column' pt={{ base: "120px", md: "75px", lg: "100px" }}>
      {/* Profile Header */}
      <Flex
        direction={{ sm: "column", md: "row" }}
        mb='24px'
        maxH='330px'
        justifyContent={{ sm: "center", md: "space-between" }}
        align='center'
        backdropFilter='blur(21px)'
        boxShadow='0px 2px 5.5px rgba(0, 0, 0, 0.02)'
        border='1.5px solid'
        borderColor={borderProfileColor}
        bg={bgProfile}
        p='24px'
        borderRadius='20px'>
        <Flex
          align='center'
          mb={{ sm: "10px", md: "0px" }}
          direction={{ sm: "column", md: "row" }}
          w={{ sm: "100%" }}
          textAlign={{ sm: "center", md: "start" }}>
          <Box position="relative">
            <Avatar
              me={{ md: "22px" }}
              src={formData.profilePicture || user.profilePicture}
              w='80px'
              h='80px'
              borderRadius='15px'
            />
            {isEditing && (
              <Button
                position="absolute"
                bottom="0"
                right={{ md: "22px" }}
                size="sm"
                borderRadius="full"
                bg={iconColor}
                color="white"
                onClick={() => fileInputRef.current?.click()}
                _hover={{ bg: iconColor, opacity: 0.8 }}>
                <Icon as={FaCamera} />
              </Button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </Box>
          <Flex direction='column' maxWidth='100%' my={{ sm: "14px" }}>
            <Text
              fontSize={{ sm: "lg", lg: "xl" }}
              color={textColor}
              fontWeight='bold'
              ms={{ sm: "8px", md: "0px" }}>
              {user.name}
            </Text>
            <Text
              fontSize={{ sm: "sm", md: "md" }}
              color={emailColor}
              fontWeight='semibold'>
              {user.email}
            </Text>
          </Flex>
        </Flex>
        <Flex
          direction={{ sm: "column", lg: "row" }}
          w={{ sm: "100%", md: "50%", lg: "auto" }}>
          <Button 
            p='0px' 
            bg='transparent' 
            variant='no-effects'
            onClick={() => setIsEditing(!isEditing)}>
            <Flex
              align='center'
              w={{ sm: "100%", lg: "135px" }}
              bg={colorMode === "dark" ? "navy.900" : "#fff"}
              borderRadius='8px'
              justifyContent='center'
              py='10px'
              boxShadow='0px 2px 5.5px rgba(0, 0, 0, 0.06)'
              cursor='pointer'>
              <Icon color={textColor} as={isEditing ? FaTimes : FaEdit} me='6px' />
              <Text fontSize='xs' color={textColor} fontWeight='bold'>
                {isEditing ? 'CANCEL' : 'EDIT'}
              </Text>
            </Flex>
          </Button>
          {isEditing && (
            <Button 
              p='0px' 
              bg='transparent' 
              variant='no-effects'
              onClick={handleSaveProfile}
              isLoading={isLoading}>
              <Flex
                align='center'
                w={{ lg: "135px" }}
                bg={iconColor}
                borderRadius='8px'
                justifyContent='center'
                py='10px'
                mx={{ lg: "1rem" }}
                cursor='pointer'>
                <Icon color="white" as={FaSave} me='6px' />
                <Text fontSize='xs' color="white" fontWeight='bold'>
                  SAVE
                </Text>
              </Flex>
            </Button>
          )}
        </Flex>
      </Flex>

      {error && (
        <Alert status='error' mb='24px' borderRadius='md'>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Content Grid */}
      <Grid templateColumns={{ sm: "1fr", xl: "repeat(2, 1fr)" }} gap='22px'>
        {/* Basic Info Card */}
        <Card p='16px'>
          <CardHeader p='12px 5px' mb='12px'>
            <Flex align="center">
              <Icon as={FaUser} color={iconColor} me='10px' />
              <Text fontSize='lg' color={textColor} fontWeight='bold'>
                Basic Info
              </Text>
            </Flex>
          </CardHeader>
          <CardBody px='5px'>
            <Flex direction='column'>
              <FormControl mb='20px'>
                <FormLabel fontSize='sm' color='gray.400' fontWeight='600'>
                  Full Name
                </FormLabel>
                {isEditing ? (
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    variant='auth'
                    fontSize='sm'
                    placeholder='Enter your full name'
                  />
                ) : (
                  <Text fontSize='md' color={textColor} fontWeight='400'>
                    {user.name}
                  </Text>
                )}
              </FormControl>

              <FormControl mb='20px'>
                <FormLabel fontSize='sm' color='gray.400' fontWeight='600'>
                  Profile Picture
                </FormLabel>
                <Text fontSize='sm' color='gray.400' fontWeight='400'>
                  {isEditing ? 'Click the camera icon above to upload' : 'Use edit mode to change'}
                </Text>
              </FormControl>

              <FormControl mb='20px'>
                <FormLabel fontSize='sm' color='gray.400' fontWeight='600'>
                  Username / Email ID
                </FormLabel>
                <Text fontSize='md' color='gray.400' fontWeight='400'>
                  {user.email}
                </Text>
              </FormControl>

              <FormControl mb='20px'>
                <FormLabel fontSize='sm' color='gray.400' fontWeight='600'>
                  Phone Number (Optional)
                </FormLabel>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    variant='auth'
                    fontSize='sm'
                    placeholder='Enter your phone number'
                  />
                ) : (
                  <Text fontSize='md' color='gray.400' fontWeight='400'>
                    {user.phone || 'Not provided'}
                  </Text>
                )}
              </FormControl>
            </Flex>
          </CardBody>
        </Card>

        {/* Security Settings Card */}
        <Card p='16px'>
          <CardHeader p='12px 5px' mb='12px'>
            <Flex align="center">
              <Icon as={FaLock} color={iconColor} me='10px' />
              <Text fontSize='lg' color={textColor} fontWeight='bold'>
                Security Settings
              </Text>
            </Flex>
          </CardHeader>
          <CardBody px='5px'>
            <Flex direction='column'>
              <Button
                variant='outline'
                colorScheme='blue'
                mb='20px'
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                leftIcon={<FaLock />}>
                Change Password
              </Button>

              {showPasswordForm && (
                <Flex direction='column' mb='20px'>
                  <FormControl mb='15px'>
                    <FormLabel fontSize='sm' color='gray.400' fontWeight='600'>
                      Current Password
                    </FormLabel>
                    <Input
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      variant='auth'
                      fontSize='sm'
                      placeholder='Enter current password'
                    />
                  </FormControl>

                  <FormControl mb='15px'>
                    <FormLabel fontSize='sm' color='gray.400' fontWeight='600'>
                      New Password
                    </FormLabel>
                    <Input
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      variant='auth'
                      fontSize='sm'
                      placeholder='Enter new password'
                    />
                  </FormControl>

                  <FormControl mb='15px'>
                    <FormLabel fontSize='sm' color='gray.400' fontWeight='600'>
                      Confirm New Password
                    </FormLabel>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      variant='auth'
                      fontSize='sm'
                      placeholder='Confirm new password'
                    />
                  </FormControl>

                  <Flex gap='10px'>
                    <Button
                      colorScheme='blue'
                      size='sm'
                      onClick={handleChangePassword}
                      isLoading={isLoading}>
                      Update Password
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}>
                      Cancel
                    </Button>
                  </Flex>
                </Flex>
              )}

              <Button
                variant='outline'
                colorScheme='red'
                onClick={handleLogoutAllDevices}
                isLoading={isLoading}
                leftIcon={<FaSignOutAlt />}>
                Logout from all devices
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </Grid>
    </Flex>
  );
}

export default Profile;
