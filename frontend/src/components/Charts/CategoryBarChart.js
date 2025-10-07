import React, { useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  useColorMode,
  Grid,
  GridItem,
  Badge,
} from "@chakra-ui/react";
import Chart from "react-apexcharts";
import { useTransactions } from "contexts/TransactionContext";

const CategoryBarChart = () => {
  const textColor = useColorModeValue("gray.700", "white");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const { colorMode } = useColorMode();
  const { transactions } = useTransactions();

  // Generate modern gradient colors for categories
  const generateGradientColor = (index) => {
    const gradients = [
      ["#667eea", "#764ba2"], // Purple-Blue
      ["#f093fb", "#f5576c"], // Pink-Red
      ["#4facfe", "#00f2fe"], // Blue-Cyan
      ["#43e97b", "#38f9d7"], // Green-Teal
      ["#fa709a", "#fee140"], // Pink-Yellow
      ["#a8edea", "#fed6e3"], // Teal-Pink
      ["#ff9a9e", "#fecfef"], // Coral-Pink
      ["#a18cd1", "#fbc2eb"], // Purple-Pink
      ["#ffecd2", "#fcb69f"], // Peach-Orange
      ["#ff8a80", "#ea80fc"], // Red-Purple
    ];
    return gradients[index % gradients.length];
  };

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        series: [],
        categories: [],
        options: {},
        stats: { totalAmount: 0, categoryCount: 0, avgPerCategory: 0 },
      };
    }

    // Group transactions by category and calculate totals
    const categoryTotals = {};
    const categoryTypes = {}; // Track expense vs income per category
    
    transactions.forEach((transaction) => {
      const category = (transaction.category || "others").toLowerCase();
      const amount = parseFloat(transaction.amount) || 0;
      const type = transaction.type || "expense";
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
        categoryTypes[category] = { income: 0, expense: 0 };
      }
      
      categoryTotals[category] += amount;
      categoryTypes[category][type] += amount;
    });

    // Sort categories by total amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Show top 10 categories

    const categories = sortedCategories.map(([category]) => 
      category.charAt(0).toUpperCase() + category.slice(1)
    );
    const amounts = sortedCategories.map(([, amount]) => amount);

    // Calculate statistics
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const categoryCount = categories.length;
    const avgPerCategory = categoryCount > 0 ? totalAmount / categoryCount : 0;

    // Create gradient colors for each bar
    const colors = categories.map((_, index) => {
      const [start, end] = generateGradientColor(index);
      return {
        fill: {
          type: "gradient",
          gradient: {
            shade: "light",
            type: "vertical",
            shadeIntensity: 0.25,
            gradientToColors: [end],
            inverseColors: false,
            opacityFrom: 0.85,
            opacityTo: 0.85,
            stops: [0, 100],
          },
        },
      };
    });

    const options = {
      chart: {
        type: "bar",
        height: 400,
        toolbar: { show: false },
        background: "transparent",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "60%",
          distributed: true,
          dataLabels: {
            position: "top",
          },
        },
      },
      colors: categories.map((_, index) => generateGradientColor(index)[0]),
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.25,
          gradientToColors: categories.map((_, index) => generateGradientColor(index)[1]),
          inverseColors: false,
          opacityFrom: 0.85,
          opacityTo: 0.85,
          stops: [0, 100],
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `$${val.toFixed(0)}`,
        offsetY: -20,
        style: {
          fontSize: "12px",
          fontWeight: "bold",
          colors: [colorMode === "dark" ? "#fff" : "#333"],
        },
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: colorMode === "dark" ? "#fff" : "#333",
            fontSize: "12px",
          },
          rotate: -45,
          rotateAlways: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: {
            colors: colorMode === "dark" ? "#fff" : "#333",
            fontSize: "12px",
          },
          formatter: (val) => `$${val.toFixed(0)}`,
        },
      },
      grid: {
        show: true,
        borderColor: colorMode === "dark" ? "#374151" : "#e5e7eb",
        strokeDashArray: 3,
        position: "back",
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        theme: colorMode,
        y: {
          formatter: (val) => `$${val.toFixed(2)}`,
        },
        style: {
          fontSize: "12px",
        },
      },
      legend: { show: false },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: { height: 300 },
            plotOptions: {
              bar: { columnWidth: "80%" },
            },
            xaxis: {
              labels: {
                rotate: -90,
                style: { fontSize: "10px" },
              },
            },
          },
        },
      ],
    };

    return {
      series: [{ name: "Amount", data: amounts }],
      categories,
      options,
      stats: { totalAmount, categoryCount, avgPerCategory },
      categoryDetails: sortedCategories.map(([category, amount]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        amount,
        percentage: ((amount / totalAmount) * 100).toFixed(1),
        types: categoryTypes[category],
      })),
    };
  }, [transactions, colorMode]);

  return (
    <Box>
      {/* Header Section */}
      <Flex direction="column" mb="20px">
        <Text color={textColor} fontSize="lg" fontWeight="bold" mb="6px">
          Category Spending Analysis
        </Text>
        <Text color="gray.400" fontSize="sm" mb="4">
          Top spending categories with detailed breakdown
        </Text>
        
        {/* Statistics Cards */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="4" mb="4">
          <GridItem>
            <Box
              bg={cardBg}
              p="4"
              borderRadius="12px"
              border="1px solid"
              borderColor={borderColor}
              textAlign="center"
            >
              <Text fontSize="2xl" fontWeight="bold" color="blue.400">
                ${chartData.stats.totalAmount.toFixed(0)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Total Spending
              </Text>
            </Box>
          </GridItem>
          <GridItem>
            <Box
              bg={cardBg}
              p="4"
              borderRadius="12px"
              border="1px solid"
              borderColor={borderColor}
              textAlign="center"
            >
              <Text fontSize="2xl" fontWeight="bold" color="green.400">
                {chartData.stats.categoryCount}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Active Categories
              </Text>
            </Box>
          </GridItem>
          <GridItem>
            <Box
              bg={cardBg}
              p="4"
              borderRadius="12px"
              border="1px solid"
              borderColor={borderColor}
              textAlign="center"
            >
              <Text fontSize="2xl" fontWeight="bold" color="purple.400">
                ${chartData.stats.avgPerCategory.toFixed(0)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Avg per Category
              </Text>
            </Box>
          </GridItem>
        </Grid>
      </Flex>

      {/* Chart Section */}
      <Box minH="400px" w="100%">
        {transactions.length > 0 ? (
          <Chart
            options={chartData.options}
            series={chartData.series}
            type="bar"
            height={400}
          />
        ) : (
          <Flex align="center" justify="center" minH="400px" direction="column">
            <Text color="gray.400" fontSize="lg" mb="4">
              No transaction data available
            </Text>
            <Text color="gray.400" fontSize="sm">
              Add some transactions to see the category analysis
            </Text>
          </Flex>
        )}
      </Box>

      {/* Category Details Section */}
      {chartData.categoryDetails.length > 0 && (
        <Box mt="6">
          <Text color={textColor} fontSize="md" fontWeight="bold" mb="4">
            Category Breakdown
          </Text>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap="3">
            {chartData.categoryDetails.slice(0, 6).map((category, index) => (
              <GridItem key={category.name}>
                <Box
                  bg={cardBg}
                  p="4"
                  borderRadius="10px"
                  border="1px solid"
                  borderColor={borderColor}
                  position="relative"
                  overflow="hidden"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {/* Gradient background accent */}
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    height="3px"
                    bgGradient={`linear(to-r, ${generateGradientColor(index)[0]}, ${generateGradientColor(index)[1]})`}
                  />
                  
                  <Flex justify="space-between" align="center" mb="2">
                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                      {category.name}
                    </Text>
                    <Badge
                      colorScheme="blue"
                      variant="subtle"
                      fontSize="xs"
                      borderRadius="full"
                    >
                      {category.percentage}%
                    </Badge>
                  </Flex>
                  
                  <Text fontSize="lg" fontWeight="bold" color="green.400" mb="1">
                    ${category.amount.toFixed(2)}
                  </Text>
                  
                  <Flex justify="space-between" fontSize="xs" color="gray.500">
                    <Text>Income: ${category.types.income.toFixed(0)}</Text>
                    <Text>Expense: ${category.types.expense.toFixed(0)}</Text>
                  </Flex>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default CategoryBarChart;
