// src/components/SafeApexChart.jsx

import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Box, Text, Button, VStack, useColorModeValue } from '@chakra-ui/react';

const SafeApexChart = ({
  data,
  labels,
  height = 300,
  fallbackText = "No data available",
  ...props
}) => {
  const [isValid, setIsValid] = useState(false);
  const [chartType, setChartType] = useState('pie'); // default chart type
  const textColor = useColorModeValue('#1A202C', '#FFFFFF');

  // Validate incoming data
  useEffect(() => {
    const validateData = () => {
      if (!data || !Array.isArray(data) || data.length === 0) return false;
      if (!labels || !Array.isArray(labels) || labels.length === 0) return false;
      if (data.length !== labels.length) return false;
      if (!data.every(val => typeof val === 'number' && !isNaN(val) && val >= 0)) return false;
      if (!labels.every(label => typeof label === 'string' && label.trim().length > 0)) return false;
      return true;
    };
    setIsValid(validateData());
  }, [data, labels]);

  // Toggle chart type
  const toggleChartType = () => {
    setChartType(prev => (prev === 'pie' ? 'bar' : 'pie'));
  };

  // If invalid data, show fallback
  if (!isValid) {
    return (
      <Box
        height={height}
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="1px dashed"
        borderColor="gray.300"
        borderRadius="md"
      >
        <Text color={textColor} fontSize="sm" textAlign="center">
          {fallbackText}
        </Text>
      </Box>
    );
  }

  // Chart configuration
  const chartOptions = {
    labels: labels,
    chart: { id: 'safe-chart' },
    plotOptions: chartType === 'bar' ? { bar: { horizontal: false } } : {},
  };

  const chartSeries = chartType === 'pie' ? data : [{ data }];

  return (
    <VStack spacing={2} align="stretch" {...props}>
      {/* Toggle button aligned right */}
      <Box display="flex" justifyContent="flex-end">
        <Button onClick={toggleChartType} size="sm" colorScheme="blue">
          Switch to {chartType === 'pie' ? 'Bar' : 'Pie'} Chart
        </Button>
      </Box>

      {/* Chart */}
      <Box height={height} width="100%">
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type={chartType}
          height={height}
        />
      </Box>
    </VStack>
  );
};

export default SafeApexChart;
