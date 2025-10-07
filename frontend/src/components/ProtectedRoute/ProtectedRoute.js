import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, Flex, Text } from '@chakra-ui/react';

const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Flex
        height="100vh"
        alignItems="center"
        justifyContent="center"
        direction="column"
      >
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} fontSize="lg" color="gray.600">
          Loading...
        </Text>
      </Flex>
    );
  }

  // Redirect to sign-up page if not authenticated
  if (!authenticated) {
    return <Redirect to="/auth/signup" />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
