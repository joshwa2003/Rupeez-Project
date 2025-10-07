import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  useColorModeValue,
  Icon,
  Flex,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { FaBrain, FaLightbulb, FaChartLine, FaSync } from 'react-icons/fa';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';
import { aiInsightsService } from '../../services/aiInsightsService';

const AIInsights = ({ timeframe = '90d' }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    fetchInsights();
  }, [timeframe]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiInsightsService.getSpendingInsights(timeframe);
      setInsights(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
    toast({
      title: 'Insights Updated',
      description: 'AI insights have been refreshed with latest data',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'comparison':
        return FaChartLine;
      case 'category':
        return FaLightbulb;
      case 'trend':
        return FaChartLine;
      case 'goal':
        return FaLightbulb;
      default:
        return FaBrain;
    }
  };

  const getInsightColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'positive':
        return 'green';
      default:
        return 'blue';
    }
  };

  if (loading) {
    return (
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Spinner size="lg" color="blue.500" />
            <Text color={textColor}>Generating AI insights...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardBody>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Unable to load AI insights</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
          <Button mt={4} onClick={fetchInsights} colorScheme="blue" size="sm">
            Try Again
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
      <CardHeader>
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaBrain} color="purple.500" boxSize={5} />
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              AI Spending Insights
            </Text>
          </HStack>
          <Tooltip label="Refresh insights">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              isLoading={refreshing}
              loadingText="Refreshing"
            >
              <Icon as={FaSync} />
            </Button>
          </Tooltip>
        </Flex>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Summary */}
          {insights?.summary && (
            <Box>
              <Text fontSize="md" fontWeight="semibold" color={textColor} mb={2}>
                Monthly Summary
              </Text>
              <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                <Text color={textColor} fontSize="sm">
                  Current month spending: <strong>₹{insights.summary.currentMonthSpending?.toFixed(0) || 0}</strong>
                </Text>
                {insights.summary.changePercentage !== undefined && (
                  <Text color={textColor} fontSize="sm" mt={1}>
                    Trend: <Badge colorScheme={insights.summary.trend === 'increasing' ? 'red' : insights.summary.trend === 'decreasing' ? 'green' : 'gray'}>
                      {insights.summary.trend}
                    </Badge>
                    {insights.summary.changePercentage !== 0 && (
                      <span> ({insights.summary.changePercentage > 0 ? '+' : ''}{insights.summary.changePercentage.toFixed(1)}%)</span>
                    )}
                  </Text>
                )}
              </Box>
            </Box>
          )}

          {/* Key Insights */}
          {insights?.insights && insights.insights.length > 0 && (
            <Box>
              <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                Key Insights
              </Text>
              <VStack spacing={3} align="stretch">
                {insights.insights.map((insight, index) => (
                  <Box
                    key={index}
                    p={4}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    bg={useColorModeValue('white', 'gray.800')}
                  >
                    <HStack spacing={3} align="start">
                      <Icon
                        as={getInsightIcon(insight.type)}
                        color={`${getInsightColor(insight.impact)}.500`}
                        boxSize={4}
                        mt={0.5}
                      />
                      <Box flex={1}>
                        <Text color={textColor} fontSize="sm" lineHeight="1.5">
                          {insight.message}
                        </Text>
                        {insight.amount && (
                          <Text color={mutedTextColor} fontSize="xs" mt={1}>
                            Amount: ₹{insight.amount.toFixed(0)}
                          </Text>
                        )}
                      </Box>
                      <Badge
                        colorScheme={getInsightColor(insight.impact)}
                        size="sm"
                        variant="subtle"
                      >
                        {insight.impact}
                      </Badge>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Recommendations */}
          {insights?.recommendations && insights.recommendations.length > 0 && (
            <Box>
              <Divider />
              <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3} mt={4}>
                AI Recommendations
              </Text>
              <VStack spacing={2} align="stretch">
                {insights.recommendations.map((recommendation, index) => (
                  <HStack key={index} spacing={3} align="start">
                    <Icon as={FaLightbulb} color="yellow.500" boxSize={4} mt={0.5} />
                    <Text color={textColor} fontSize="sm" lineHeight="1.5">
                      {recommendation}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Empty state */}
          {(!insights?.insights || insights.insights.length === 0) && (
            <Box textAlign="center" py={6}>
              <Icon as={FaBrain} boxSize={12} color={mutedTextColor} mb={4} />
              <Text color={mutedTextColor} fontSize="sm">
                {insights?.summary?.message || 'No insights available yet. Add more transactions to get AI-powered analysis!'}
              </Text>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default AIInsights;
