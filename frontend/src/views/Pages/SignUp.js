// Chakra imports
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Link,
  Switch,
  Text,
  useColorModeValue,
  LightMode,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from "@chakra-ui/react";
// Assets
import BgSignUp from "assets/img/BgSignUp.png";
import React, { useState } from "react";
import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const history = useHistory();
  const toast = useToast();
  const { login } = useAuth();
  
  const bgForm = useColorModeValue("white", "navy.800");
  const titleColor = useColorModeValue("gray.700", "blue.500");
  const textColor = useColorModeValue("gray.700", "white");
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
    if (!formData.name.trim()) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }
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
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.data.status === 'success') {
        // Auto-login user after successful registration
        login(response.data.data.token, response.data.data.user);

        // Show success message
        toast({
          title: "Registration Successful!",
          description: `Welcome ${response.data.data.user.name}! Redirecting to dashboard...`,
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
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      toast({
        title: "Registration Failed",
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
    <Flex
      direction='column'
      alignSelf='center'
      justifySelf='center'
      overflow='hidden'>
      <Box
        position='absolute'
        minH={{ base: "70vh", md: "50vh" }}
        maxH={{ base: "70vh", md: "50vh" }}
        w={{ md: "calc(100vw - 50px)" }}
        maxW={{ md: "calc(100vw - 50px)" }}
        left='0'
        right='0'
        bgRepeat='no-repeat'
        overflow='hidden'
        zIndex='-1'
        top='0'
        bgImage={BgSignUp}
        bgSize='cover'
        mx={{ md: "auto" }}
        mt={{ md: "14px" }}
        borderRadius={{ base: "0px", md: "20px" }}>
        <Box w='100vw' h='100vh' bg='blue.500' opacity='0.8'></Box>
      </Box>
      <Flex
        direction='column'
        textAlign='center'
        justifyContent='center'
        align='center'
        mt='125px'
        mb='30px'>
        <Text fontSize='4xl' color='white' fontWeight='bold'>
          Welcome!
        </Text>
        <Text
          fontSize='md'
          color='white'
          fontWeight='normal'
          mt='10px'
          mb='26px'
          w={{ base: "90%", sm: "60%", lg: "40%", xl: "333px" }}>
          Use these awesome forms to login or create new account in your project
          for free.
        </Text>
      </Flex>
      <Flex alignItems='center' justifyContent='center' mb='60px' mt='20px'>
        <Flex
          direction='column'
          w='445px'
          background='transparent'
          borderRadius='15px'
          p='40px'
          mx={{ base: "100px" }}
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
            Register With
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
                Name
              </FormLabel>
              <Input
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                variant='auth'
                fontSize='sm'
                ms='4px'
                type='text'
                placeholder='Your full name'
                mb='24px'
                size='lg'
                isRequired
              />
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
                placeholder='Your password (min 6 characters)'
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
                loadingText='Creating Account...'
                disabled={isLoading}>
                SIGN UP
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
              Already have an account?
              <Link
                color={titleColor}
                as='span'
                ms='5px'
                onClick={() => history.push('/auth/signin')}
                cursor='pointer'
                fontWeight='bold'>
                Sign In
              </Link>
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default SignUp;
