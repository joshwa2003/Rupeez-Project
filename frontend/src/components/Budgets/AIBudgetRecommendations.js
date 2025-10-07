import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Icon,
  Flex,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { FaRobot, FaPlus, FaEdit, FaArrowUp, FaArrowDown, FaLightbulb } from 'react-icons/fa';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';
import { aiInsightsService } from '../../services/aiInsightsService';

const AIBudgetRecommendations = ({ onCreateBudget, onEditBudget }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiInsightsService.getBudgetRecommendations();
      setRecommendations(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching budget recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = (recommendation) => {
    setSelectedRecommendation(recommendation);
    onOpen();
  };

  const handleConfirmApply = () => {
    if (!selectedRecommendation) return;

    const budgetData = {
      category: selectedRecommendation.category,
      limitAmount: selectedRecommendation.suggestedAmount,
      period: 'monthly'
    };

    if (selectedRecommendation.type === 'new_budget') {
      onCreateBudget?.(budgetData);
    } else if (selectedRecommendation.type === 'increase_budget' || selectedRecommendation.type === 'decrease_budget') {
      onEditBudget?.(budgetData);
    }

    toast({
      title: 'Recommendation Applied',
      description: `Budget recommendation for ${selectedRecommendation.category} has been applied`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    onClose();
    setSelectedRecommendation(null);
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'new_budget':
        return FaPlus;
      case 'increase_budget':
        return FaArrowUp;
      case 'decrease_budget':
        return FaArrowDown;
      case 'optimization':
        return FaLightbulb;
      default:
        return FaRobot;
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'new_budget':
        return 'blue';
      case 'increase_budget':
        return 'orange';
      case 'decrease_budget':
        return 'green';
      case 'optimization':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getConfidenceBadge = (confidence) => {
    const colors = {
      high: 'green',
      medium: 'yellow',
      low: 'gray'
    };
    return <Badge colorScheme={colors[confidence] || 'gray'}>{confidence} confidence</Badge>;
  };

  if (loading) {
    return (
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Spinner size="lg" color="purple.500" />
            <Text color={textColor}>Analyzing your spending patterns...</Text>
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
              <AlertTitle>Unable to load recommendations</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
          <Button mt={4} onClick={fetchRecommendations} colorScheme="purple" size="sm">
            Try Again
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader>
          <HStack spacing={3}>
            <Icon as={FaRobot} color="purple.500" boxSize={5} />
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              AI Budget Recommendations
            </Text>
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Summary Stats */}
            {recommendations && (
              <Flex justify="space-around" wrap="wrap" gap={4}>
                <Stat textAlign="center">
                  <StatLabel color={mutedTextColor}>Recommendations</StatLabel>
                  <StatNumber color={textColor}>{recommendations.recommendations?.length || 0}</StatNumber>
                </Stat>
                {recommendations.totalRecommendedBudget > 0 && (
                  <Stat textAlign="center">
                    <StatLabel color={mutedTextColor}>Recommended Budget</StatLabel>
                    <StatNumber color={textColor}>₹{recommendations.totalRecommendedBudget.toFixed(0)}</StatNumber>
                  </Stat>
                )}
                {recommendations.savingsPotential > 0 && (
                  <Stat textAlign="center">
                    <StatLabel color={mutedTextColor}>Savings Potential</StatLabel>
                    <StatNumber color="green.500">₹{recommendations.savingsPotential.toFixed(0)}</StatNumber>
                    <StatHelpText>per month</StatHelpText>
                  </Stat>
                )}
              </Flex>
            )}

            <Divider />

            {/* Recommendations List */}
            {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {recommendations.recommendations.map((recommendation, index) => (
                  <Box
                    key={index}
                    p={4}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    bg={useColorModeValue('white', 'gray.800')}
                    _hover={{ borderColor: `${getRecommendationColor(recommendation.type)}.300` }}
                    transition="border-color 0.2s"
                  >
                    <Flex justify="space-between" align="start" mb={3}>
                      <HStack spacing={3} flex={1}>
                        <Icon
                          as={getRecommendationIcon(recommendation.type)}
                          color={`${getRecommendationColor(recommendation.type)}.500`}
                          boxSize={5}
                        />
                        <Box flex={1}>
                          <Text fontWeight="semibold" color={textColor} mb={1}>
                            {recommendation.category || 'General'}
                          </Text>
                          <Text color={textColor} fontSize="sm" lineHeight="1.5">
                            {recommendation.reason || recommendation.message}
                          </Text>
                        </Box>
                      </HStack>
                      {recommendation.confidence && getConfidenceBadge(recommendation.confidence)}
                    </Flex>

                    {/* Amount Details */}
                    {recommendation.suggestedAmount && (
                      <HStack spacing={4} mb={3}>
                        {recommendation.currentAmount && (
                          <Text fontSize="sm" color={mutedTextColor}>
                            Current: ₹{recommendation.currentAmount.toFixed(0)}
                          </Text>
                        )}
                        <Text fontSize="sm" color={textColor} fontWeight="semibold">
                          Suggested: ₹{recommendation.suggestedAmount.toFixed(0)}
                        </Text>
                        {recommendation.potentialSavings && (
                          <Text fontSize="sm" color="green.500">
                            Save: ₹{recommendation.potentialSavings.toFixed(0)}/month
                          </Text>
                        )}
                      </HStack>
                    )}

                    {/* Action Button */}
                    {(recommendation.type === 'new_budget' || 
                      recommendation.type === 'increase_budget' || 
                      recommendation.type === 'decrease_budget') && (
                      <Button
                        size="sm"
                        colorScheme={getRecommendationColor(recommendation.type)}
                        variant="outline"
                        onClick={() => handleApplyRecommendation(recommendation)}
                        leftIcon={<Icon as={getRecommendationIcon(recommendation.type)} />}
                      >
                        {recommendation.type === 'new_budget' ? 'Create Budget' : 'Update Budget'}
                      </Button>
                    )}
                  </Box>
                ))}
              </VStack>
            ) : (
              <Box textAlign="center" py={8}>
                <Icon as={FaRobot} boxSize={12} color={mutedTextColor} mb={4} />
                <Text color={mutedTextColor} fontSize="sm" mb={2}>
                  No budget recommendations available yet
                </Text>
                <Text color={mutedTextColor} fontSize="xs">
                  Add more transactions to get personalized budget suggestions
                </Text>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Apply Budget Recommendation</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRecommendation && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Are you sure you want to apply this recommendation for{' '}
                  <strong>{selectedRecommendation.category}</strong>?
                </Text>
                
                <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                  <Text fontSize="sm" mb={2}>
                    <strong>Recommendation:</strong> {selectedRecommendation.reason || selectedRecommendation.message}
                  </Text>
                  {selectedRecommendation.suggestedAmount && (
                    <Text fontSize="sm">
                      <strong>Suggested Budget:</strong> ₹{selectedRecommendation.suggestedAmount.toFixed(0)}
                    </Text>
                  )}
                </Box>

                <HStack spacing={3} justify="flex-end">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button colorScheme="purple" onClick={handleConfirmApply}>
                    Apply Recommendation
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AIBudgetRecommendations;
