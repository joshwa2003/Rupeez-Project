import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import SetGoalForm from 'components/GoalPlanner/SetGoalForm';
import ProgressBar from 'components/GoalPlanner/ProgressBar';
import ProjectionChart from 'components/GoalPlanner/ProjectionChart';
import { savingsGoalsAPI } from 'services/api';

const GoalPlanner = () => {
  const textColor = useColorModeValue('gray.700', 'white');
  const bgColor = useColorModeValue('white', 'gray.700');
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await savingsGoalsAPI.getAll();
      setGoals(data.savingsGoals);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch goals',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedGoal) {
        await savingsGoalsAPI.update(selectedGoal._id, formData);
        toast({
          title: 'Success',
          description: 'Goal updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await savingsGoalsAPI.create(formData);
        toast({
          title: 'Success',
          description: 'Goal created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      setShowForm(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save goal',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowForm(true);
  };

  const handleNewGoal = () => {
    setSelectedGoal(null);
    setShowForm(true);
  };

  return (
    <Box p={4} bg={bgColor} borderRadius="md" boxShadow="md" maxW="800px" mx="auto">
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="2xl" fontWeight="bold" color={textColor}>
          Goal Planner
        </Text>
        <Button colorScheme="blue" onClick={handleNewGoal}>
          Set New Goal
        </Button>
      </Flex>

      {showForm ? (
        <SetGoalForm onSubmit={handleFormSubmit} />
      ) : goals.length === 0 ? (
        <Text color={textColor}>No goals set yet. Click "Set New Goal" to create one.</Text>
      ) : (
        goals.map((goal) => (
          <Box key={goal._id} mb={6} p={4} borderWidth="1px" borderRadius="md" bg={useColorModeValue('gray.50', 'gray.800')}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="bold" fontSize="lg" color={textColor}>
                {goal.title}
              </Text>
              <Button size="sm" onClick={() => handleEditGoal(goal)}>
                Edit
              </Button>
            </Flex>
            <ProgressBar progress={(goal.currentAmount / goal.targetAmount) * 100} />
            <ProjectionChart projectionData={goal.projectionData || []} />
          </Box>
        ))
      )}
    </Box>
  );
};

export default GoalPlanner;
