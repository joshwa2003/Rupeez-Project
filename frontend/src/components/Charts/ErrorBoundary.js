import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const textColor = useColorModeValue('#1A202C', '#FFFFFF');
      return (
        <Box 
          height={this.props.height || 300} 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          border="1px dashed"
          borderColor="gray.300"
          borderRadius="md"
        >
          <Text color={textColor} fontSize="sm" textAlign="center">
            Chart failed to load
          </Text>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;
