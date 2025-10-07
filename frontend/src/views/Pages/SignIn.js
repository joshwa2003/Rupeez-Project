import React, { useState } from "react";
// Chakra imports
import {
  Box,
  Flex,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Icon,
  Link,
  Switch,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
} from "@chakra-ui/react";
// Assets
import signInImage from "assets/img/signInImage.png";
import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const history = useHistory();
  const toast = useToast();
  const { login } = useAuth();
  
  // Chakra color mode
  const textColor = useColorModeValue("gray.700", "white");
  const bgForm = useColorModeValue("white", "navy.800");
  const titleColor = useColorModeValue("gray.700", "blue.500");
  const colorIcons = useColorModeValue("gray.700", "white");
  const bgIcons = useColorModeValue("trasnparent", "navy.700");
  const bgIconsHover = useColorModeValue("gray.50", "whiteAlpha.100");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!formData.email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.data.status === 'success') {
        // Use AuthContext login method
        login(response.data.data.token, response.data.data.user);

        // Show success message
        toast({
          title: "Login Successful!",
          description: `Welcome back, ${response.data.data.user.name}!`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Redirect to dashboard
        setTimeout(() => {
          history.push('/admin/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        status: "error",
        duration: 5001,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Flex position='relative' mb='40px'>
      <Flex
        minH={{ md: "1000px" }}
        h={{ sm: "initial", md: "75vh", lg: "85vh" }}
        w='100%'
        maxW='1044px'
        mx='auto'
        justifyContent='space-between'
        mb='30px'
        pt={{ md: "0px" }}>
        <Flex
          w='100%'
          h='100%'
          alignItems='center'
          justifyContent='center'
          mb='60px'
          mt={{ base: "50px", md: "20px" }}>
          <Flex
            zIndex='2'
            direction='column'
            w='445px'
            background='transparent'
            borderRadius='15px'
            p='40px'
            mx={{ base: "100px" }}
            m={{ base: "20px", md: "auto" }}
            bg={bgForm}
            boxShadow={useColorModeValue(
              "0px 5px 14px rgba(0, 0, 0, 0.05)",
              "unset"
            )}>
            <Text
              fontSize='xl'
              color={textColor}
              fontWeight='bold'
              textAlign='center'
              mb='22px'>
              Sign In With
            </Text>
            <HStack spacing='15px' justify='center' mb='22px'>
              <Flex
                justify='center'
                align='center'
                w='75px'
                h='75px'
                borderRadius='8px'
                border={useColorModeValue("1px solid", "0px")}
                borderColor='gray.200'
                cursor='pointer'
                transition='all .25s ease'
                bg={bgIcons}
                _hover={{ bg: bgIconsHover }}>
                <Link href='#'>
                  <Icon as={FaFacebook} color={colorIcons} w='30px' h='30px' />
                </Link>
              </Flex>
              <Flex
                justify='center'
                align='center'
                w='75px'
                h='75px'
                borderRadius='8px'
                border={useColorModeValue("1px solid", "0px")}
                borderColor='gray.200'
                cursor='pointer'
                transition='all .25s ease'
                bg={bgIcons}
                _hover={{ bg: bgIconsHover }}>
                <Link href='#'>
                  <Icon
                    as={FaApple}
                    color={colorIcons}
                    w='30px'
                    h='30px'
                    _hover={{ filter: "brightness(120%)" }}
                  />
                </Link>
              </Flex>
              <Flex
                justify='center'
                align='center'
                w='75px'
                h='75px'
                borderRadius='8px'
                border={useColorModeValue("1px solid", "0px")}
                borderColor='gray.200'
                cursor='pointer'
                transition='all .25s ease'
                bg={bgIcons}
                _hover={{ bg: bgIconsHover }}>
                <Link href='#'>
                  <Icon
                    as={FaGoogle}
                    color={colorIcons}
                    w='30px'
                    h='30px'
                    _hover={{ filter: "brightness(120%)" }}
                  />
                </Link>
              </Flex>
            </HStack>
            <Text
              fontSize='lg'
              color='gray.400'
              fontWeight='bold'
              textAlign='center'
              mb='22px'>
              or
            </Text>
            {error && (
              <Alert status='error' mb='24px' borderRadius='md'>
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <FormControl>
                <FormLabel ms='4px' fontSize='sm' fontWeight='normal'>
                  Email
                </FormLabel>
                <Input
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  variant='auth'
                  fontSize='sm'
                  ms='4px'
                  type='email'
                  placeholder='Your email address'
                  mb='24px'
                  size='lg'
                  isRequired
                />
                <FormLabel ms='4px' fontSize='sm' fontWeight='normal'>
                  Password
                </FormLabel>
                <Input
                  name='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  variant='auth'
                  fontSize='sm'
                  ms='4px'
                  type='password'
                  placeholder='Your password'
                  mb='24px'
                  size='lg'
                  isRequired
                />
                <FormControl display='flex' alignItems='center' mb='24px'>
                  <Switch 
                    id='remember-login' 
                    colorScheme='blue' 
                    me='10px'
                    isChecked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <FormLabel htmlFor='remember-login' mb='0' fontWeight='normal'>
                    Remember me
                  </FormLabel>
                </FormControl>
                <Button
                  type='submit'
                  fontSize='10px'
                  variant='dark'
                  fontWeight='bold'
                  w='100%'
                  h='45'
                  mb='24px'
                  isLoading={isLoading}
                  loadingText='Signing In...'
                  disabled={isLoading}>
                  SIGN IN
                </Button>
              </FormControl>
            </form>
            <Flex
              flexDirection='column'
              justifyContent='center'
              alignItems='center'
              maxW='100%'
              mt='0px'>
              <Text color={textColor} fontWeight='medium'>
                Don't have an account?
                <Link
                  color={titleColor}
                  as='span'
                  ms='5px'
                  onClick={() => history.push('/auth/signup')}
                  cursor='pointer'
                  fontWeight='bold'>
                  Sign Up
                </Link>
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Box
          overflowX='hidden'
          h='100%'
          w='100%'
          left='0px'
          position='absolute'
          bgImage={signInImage}>
          <Box
            w='100%'
            h='100%'
            bgSize='cover'
            bg='blue.500'
            opacity='0.8'></Box>
        </Box>
      </Flex>
    </Flex>
  );
}

export default SignIn;
