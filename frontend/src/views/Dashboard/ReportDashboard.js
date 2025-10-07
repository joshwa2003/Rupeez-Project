import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Select,
  Spinner,
  useColorModeValue,
  useToast,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ChevronDownIcon } from "@chakra-ui/icons";

// Custom components
import Card from "components/Card/Card";
import CardHeader from "components/Card/CardHeader";
import CardBody from "components/Card/CardBody";
import LineChart from "components/Charts/LineChart";
import PieChart from "components/Charts/PieChart";

// PDF Export
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { exportToPDF } from "utils/exportUtils";

// Date handling
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  subWeeks,
  subMonths,
  startOfMonth,
  endOfMonth,
  isToday,
  isThisWeek,
  isThisMonth,
  startOfDay,
  endOfDay,
  addWeeks,
  addMonths,
  parseISO,
} from "date-fns";

// Context
import { useTransactions } from "contexts/TransactionContext";

export default function ReportDashboard() {
  const reportRef = useRef(); // ✅ single ref used throughout
  const toast = useToast();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  // States
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const categoryChartRef = useRef(null);
  
  // Custom date range states
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Colors
  const textColor = useColorModeValue("gray.700", "white");
  const iconBlue = useColorModeValue("blue.500", "blue.400");
  const bgCard = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");


  const getFormattedDateRange = () => {
    if (reportType === "daily") {
      return format(selectedDate, "MM/dd/yyyy");
    } else if (reportType === "weekly") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(weekStart, "dd MMM")} – ${format(weekEnd, "dd MMM yyyy")}`;
    } else if (reportType === "monthly") {
      return format(selectedDate, "MMMM yyyy");
    } else if (reportType === "custom") {
      if (customFromDate && customToDate) {
        return `${format(parseISO(customFromDate), "dd MMM yyyy")} – ${format(parseISO(customToDate), "dd MMM yyyy")}`;
      }
      return "Custom Range";
    }
  };

  const filterTransactions = () => {
    if (!transactions) return [];
    let filteredTransactions = [];

    if (reportType === "daily") {
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);
      filteredTransactions = transactions.filter((transaction) => {
        const transactionDate = parseISO(transaction.date);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });
    } else if (reportType === "weekly") {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      filteredTransactions = transactions.filter((transaction) => {
        const transactionDate = parseISO(transaction.date);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });
    } else if (reportType === "monthly") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      filteredTransactions = transactions.filter((transaction) => {
        const transactionDate = parseISO(transaction.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
    } else if (reportType === "custom") {
      if (customFromDate && customToDate) {
        const rangeStart = startOfDay(parseISO(customFromDate));
        const rangeEnd = endOfDay(parseISO(customToDate));
        filteredTransactions = transactions.filter((transaction) => {
          const transactionDate = parseISO(transaction.date);
          return transactionDate >= rangeStart && transactionDate <= rangeEnd;
        });
      }
    }

    return filteredTransactions;
  };

  const getPreviousPeriodTransactions = () => {
    if (!transactions) return [];
    let previousPeriodStart, previousPeriodEnd;

    if (reportType === "daily") {
      const prevDay = subDays(selectedDate, 1);
      previousPeriodStart = startOfDay(prevDay);
      previousPeriodEnd = endOfDay(prevDay);
    } else if (reportType === "weekly") {
      const prevWeekStart = subWeeks(startOfWeek(selectedDate), 1);
      const prevWeekEnd = endOfWeek(prevWeekStart);
      previousPeriodStart = prevWeekStart;
      previousPeriodEnd = prevWeekEnd;
    } else if (reportType === "monthly") {
      const prevMonthStart = subMonths(startOfMonth(selectedDate), 1);
      const prevMonthEnd = endOfMonth(prevMonthStart);
      previousPeriodStart = prevMonthStart;
      previousPeriodEnd = prevMonthEnd;
    } else if (reportType === "custom") {
      // For custom range, calculate previous period of same duration
      if (customFromDate && customToDate) {
        const fromDate = parseISO(customFromDate);
        const toDate = parseISO(customToDate);
        const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
        previousPeriodStart = startOfDay(subDays(fromDate, daysDiff + 1));
        previousPeriodEnd = endOfDay(subDays(fromDate, 1));
      } else {
        return [];
      }
    }

    return transactions.filter((transaction) => {
      const transactionDate = parseISO(transaction.date);
      return transactionDate >= previousPeriodStart && transactionDate <= previousPeriodEnd;
    });
  };

  const processReportData = useCallback(() => {
    try {
      setLoading(true);

      const filteredTransactions = filterTransactions();
      const previousPeriodTransactions = getPreviousPeriodTransactions();

      let income = 0;
      let expenses = 0;
      let previousIncome = 0;
      let previousExpenses = 0;

      // Process category data
      const categoryTotals = {};
      filteredTransactions.forEach((transaction) => {
        const category = (transaction.category || "Others").toLowerCase();
        const amount = parseFloat(transaction.amount) || 0;
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === "income") {
          categoryTotals[category].income += amount;
          income += amount;
        } else {
          categoryTotals[category].expenses += amount;
          expenses += amount;
        }
      });

      previousPeriodTransactions.forEach((transaction) => {
        if (transaction.type === "income") {
          previousIncome += parseFloat(transaction.amount);
        } else {
          previousExpenses += parseFloat(transaction.amount);
        }
      });

      const netBalance = income - expenses;
      const previousNetBalance = previousIncome - previousExpenses;

      const incomeChange = previousIncome === 0 ? 100 : ((income - previousIncome) / previousIncome) * 100;
      const expensesChange = previousExpenses === 0 ? 100 : ((expenses - previousExpenses) / previousExpenses) * 100;
      const netBalanceChange = previousNetBalance === 0 ? 100 : ((netBalance - previousNetBalance) / Math.abs(previousNetBalance)) * 100;
      
      // Generate category chart data
      const categoryLabels = Object.keys(categoryTotals).map(
        cat => cat.charAt(0).toUpperCase() + cat.slice(1)
      );
      const categoryExpenses = Object.values(categoryTotals).map(val => val.expenses);
      const categoryIncome = Object.values(categoryTotals).map(val => val.income);
      
      // Generate colors for categories
      const generateColor = (index) => {
        const hue = (index * 47) % 360; // 47° step gives good variety
        return `hsl(${hue}, 65%, 55%)`;
      };
      
      const categoryColors = categoryLabels.map((_, i) => generateColor(i));

      let chartData = [];
      let chartLabels = [];
      let incomeData = [];
      let expenseData = [];

      if (reportType === "daily") {
        for (let hour = 0; hour < 24; hour++) {
          const hourStart = new Date(selectedDate);
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date(selectedDate);
          hourEnd.setHours(hour, 59, 59, 999);
          const hourlyTransactions = filteredTransactions.filter((t) => {
            const d = parseISO(t.date);
            return d >= hourStart && d <= hourEnd;
          });
          let hourlyIncome = 0;
          let hourlyExpense = 0;
          hourlyTransactions.forEach((t) => {
            if (t.type === "income") hourlyIncome += parseFloat(t.amount);
            else hourlyExpense += parseFloat(t.amount);
          });
          chartLabels.push(`${hour}:00`);
          incomeData.push(hourlyIncome);
          expenseData.push(hourlyExpense);
        }
      } else if (reportType === "weekly") {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        for (let day = 0; day < 7; day++) {
          const dayDate = addDays(weekStart, day);
          const dayStart = startOfDay(dayDate);
          const dayEnd = endOfDay(dayDate);
          const dailyTransactions = filteredTransactions.filter((t) => {
            const d = parseISO(t.date);
            return d >= dayStart && d <= dayEnd;
          });
          let dailyIncome = 0;
          let dailyExpense = 0;
          dailyTransactions.forEach((t) => {
            if (t.type === "income") dailyIncome += parseFloat(t.amount);
            else dailyExpense += parseFloat(t.amount);
          });
          chartLabels.push(format(dayDate, "EEE"));
          incomeData.push(dailyIncome);
          expenseData.push(dailyExpense);
        }
      } else if (reportType === "monthly") {
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        const totalWeeks = Math.ceil((monthEnd.getDate() - monthStart.getDate() + 1) / 7);
        for (let week = 0; week < totalWeeks; week++) {
          const weekStart = addDays(monthStart, week * 7);
          const weekEnd = new Date(Math.min(addDays(weekStart, 6).getTime(), monthEnd.getTime()));
          const weeklyTransactions = filteredTransactions.filter((t) => {
            const d = parseISO(t.date);
            return d >= weekStart && d <= weekEnd;
          });
          let weeklyIncome = 0;
          let weeklyExpense = 0;
          weeklyTransactions.forEach((t) => {
            if (t.type === "income") weeklyIncome += parseFloat(t.amount);
            else weeklyExpense += parseFloat(t.amount);
          });
          chartLabels.push(`Week ${week + 1}`);
          incomeData.push(weeklyIncome);
          expenseData.push(weeklyExpense);
        }
      } else if (reportType === "custom" && customFromDate && customToDate) {
        // For custom range, show daily data
        const fromDate = parseISO(customFromDate);
        const toDate = parseISO(customToDate);
        const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        
        for (let i = 0; i < daysDiff; i++) {
          const currentDay = addDays(fromDate, i);
          const dayStart = startOfDay(currentDay);
          const dayEnd = endOfDay(currentDay);
          const dailyTransactions = filteredTransactions.filter((t) => {
            const d = parseISO(t.date);
            return d >= dayStart && d <= dayEnd;
          });
          let dailyIncome = 0;
          let dailyExpense = 0;
          dailyTransactions.forEach((t) => {
            if (t.type === "income") dailyIncome += parseFloat(t.amount);
            else dailyExpense += parseFloat(t.amount);
          });
          chartLabels.push(format(currentDay, "dd MMM"));
          incomeData.push(dailyIncome);
          expenseData.push(dailyExpense);
        }
      }

      chartData = [
        { name: "Income", data: incomeData, color: "#4299E1" },
        { name: "Expenses", data: expenseData, color: "#F56565" },
      ];

      const chartOptions = {
        chart: { toolbar: { show: false } },
        colors: ["#4299E1", "#F56565"],
        stroke: { curve: "smooth" },
        xaxis: { categories: chartLabels },
        yaxis: {
          labels: {
            formatter: (v) => `₹${v.toFixed(0)}`,
          },
        },
      };

      setReportData({
        income,
        expenses,
        netBalance,
        incomeChange,
        expensesChange,
        netBalanceChange,
        chartData,
        chartOptions,
        categoryData: {
          labels: categoryLabels,
          expenses: categoryExpenses,
          income: categoryIncome,
          colors: categoryColors,
          totals: categoryTotals
        }
      });
    } catch (error) {
      console.error("Error processing report data:", error);
      toast({
        title: "Error",
        description: "Failed to process report data",
        status: "error",
        duration: 5001,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedDate, transactions, customFromDate, customToDate, toast]);

  // Process report data whenever filters change
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      processReportData();
    }
  }, [reportType, selectedDate, transactions, customFromDate, customToDate, processReportData]);

  const handleReportTypeChange = (e) => {
    const newType = e.target.value;
    setReportType(newType);
    if (newType === "custom") {
      onOpen();
    } else {
      setSelectedDate(new Date());
    }
  };

  const handleCustomDateSubmit = () => {
    if (!customFromDate || !customToDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both from and to dates",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const fromDate = parseISO(customFromDate);
    const toDate = parseISO(customToDate);

    if (fromDate > toDate) {
      toast({
        title: "Invalid Date Range",
        description: "From date must be before to date",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onClose();
    processReportData();
  };

  const navigatePrevious = () => {
    if (reportType === "custom") return;
    if (reportType === "daily") setSelectedDate(subDays(selectedDate, 1));
    else if (reportType === "weekly") setSelectedDate(subWeeks(selectedDate, 1));
    else setSelectedDate(subMonths(selectedDate, 1));
  };

  const navigateNext = () => {
    if (reportType === "custom") return;
    if (reportType === "daily") setSelectedDate(addDays(selectedDate, 1));
    else if (reportType === "weekly") setSelectedDate(addWeeks(selectedDate, 1));
    else setSelectedDate(addMonths(selectedDate, 1));
  };

  const handleExportDetailedPDF = () => {
    try {
      const filtered = filterTransactions();
      if (!filtered || filtered.length === 0) {
        toast({
          title: "No Data",
          description: "No transactions available for this period",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setLoading(true);
      const title = "Money Tracker Detailed Report";
      const subtitle = `Period: ${getFormattedDateRange()}  •  View: ${reportType.charAt(0).toUpperCase()}${reportType.slice(1)}`;
      
      let filename;
      if (reportType === "custom" && customFromDate && customToDate) {
        filename = `money-tracker-detailed-custom-${customFromDate}-to-${customToDate}`;
      } else {
        filename = `money-tracker-detailed-${reportType}-${format(selectedDate, "yyyy-MM-dd")}`;
      }

      exportToPDF(filtered, filename, { title, subtitle });

      toast({
        title: "PDF Exported",
        description: "Detailed report has been exported successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error exporting detailed PDF:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the detailed PDF.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = (exportType = 'standard') => {
    if (reportRef.current) {
      try {
        setLoading(true);
        toast({
          title: "Exporting PDF",
          description: "Please wait while we generate your report...",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
        
        setTimeout(() => {
          const targetRef = exportType === 'categories' && categoryChartRef.current 
            ? categoryChartRef.current 
            : reportRef.current;
          
          html2canvas(targetRef, { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
          }).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 30;

            pdf.setFontSize(18);
            const title = exportType === 'categories' 
              ? `Money Tracker Category Report - ${getFormattedDateRange()}` 
              : `Money Tracker Report - ${getFormattedDateRange()}`;
            
            pdf.text(title, pdfWidth / 2, 20, { align: "center" });
            pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            
            let filename;
            if (reportType === "custom" && customFromDate && customToDate) {
              filename = exportType === 'categories'
                ? `money-tracker-category-report-custom-${customFromDate}-to-${customToDate}.pdf`
                : `money-tracker-report-custom-${customFromDate}-to-${customToDate}.pdf`;
            } else {
              filename = exportType === 'categories'
                ? `money-tracker-category-report-${reportType}-${format(selectedDate, "yyyy-MM-dd")}.pdf`
                : `money-tracker-report-${reportType}-${format(selectedDate, "yyyy-MM-dd")}.pdf`;
            }
            
            pdf.save(filename);

            setLoading(false);
            toast({
              title: "PDF Exported",
              description: "Report has been exported successfully",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          }).catch(error => {
            console.error("Error generating PDF:", error);
            setLoading(false);
            toast({
              title: "Export Failed",
              description: "There was an error exporting the PDF. Please try again.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          });
        }, 500);
      } catch (error) {
        console.error("Error in PDF export:", error);
        setLoading(false);
        toast({
          title: "Export Failed",
          description: "There was an error exporting the PDF. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card ref={reportRef}>
        <CardHeader mb="12px">
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "start", md: "center" }}
            flexWrap="wrap"
            gap={3}
          >
            <Heading size="md" color={textColor}>
              Report Dashboard
            </Heading>
            <Flex align="center" flexWrap="wrap" gap={2}>
              <Select value={reportType} onChange={handleReportTypeChange} size="sm" width="120px">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Range</option>
              </Select>
              <Flex align="center">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={navigatePrevious} 
                  mr={1}
                  isDisabled={reportType === "custom"}
                >
                  <ChevronLeftIcon />
                </Button>
                <Text 
                  fontSize="sm" 
                  fontWeight="500"
                  cursor={reportType === "custom" ? "pointer" : "default"}
                  onClick={reportType === "custom" ? onOpen : undefined}
                  _hover={reportType === "custom" ? { textDecoration: "underline" } : {}}
                  whiteSpace="nowrap"
                >
                  {getFormattedDateRange()}
                </Text>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={navigateNext}
                  ml={1}
                  isDisabled={
                    reportType === "custom" ||
                    (reportType === "daily" && isToday(selectedDate)) ||
                    (reportType === "weekly" && isThisWeek(selectedDate)) ||
                    (reportType === "monthly" && isThisMonth(selectedDate))
                  }
                >
                  <ChevronRightIcon />
                </Button>
              </Flex>
              <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  colorScheme="blue"
                  rightIcon={<ChevronDownIcon />}
                  leftIcon={<DownloadIcon />}
                  isDisabled={loading || transactionsLoading || !reportData}
                  zIndex={1}
                >
                  Export PDF
                </MenuButton>
                <MenuList zIndex={10}>
                  <MenuItem onClick={handleExportDetailedPDF}>Detailed Table Report</MenuItem>
                  <MenuItem onClick={() => handleExportPDF('standard')}>Standard Report</MenuItem>
                  <MenuItem onClick={() => handleExportPDF('categories')}>Categories Report</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
        </CardHeader>

        <CardBody>
          {loading || transactionsLoading ? (
            <Flex justify="center" align="center" height="300px">
              <Spinner size="xl" color={iconBlue} />
            </Flex>
          ) : !reportData ? (
            <Flex justify="center" align="center" height="300px">
              <Text>No transaction data available</Text>
            </Flex>
          ) : (
            <>
              {/* Summary Cards */}
              <Flex direction={{ base: "column", md: "row" }} gap={4} mb={6} justify="space-between">
                {/* Income Card */}
                <SummaryCard
                  title="Total Income"
                  amount={reportData.income}
                  change={reportData.incomeChange}
                  color="blue.500"
                  icon="fas fa-dollar-sign"
                  textColor={textColor}
                  borderColor={borderColor}
                  bgCard={bgCard}
                />
                {/* Expenses Card */}
                <SummaryCard
                  title="Total Expenses"
                  amount={reportData.expenses}
                  change={reportData.expensesChange}
                  color="red.500"
                  icon="fas fa-credit-card"
                  textColor={textColor}
                  borderColor={borderColor}
                  bgCard={bgCard}
                />
                {/* Net Balance Card */}
                <SummaryCard
                  title="Net Balance"
                  amount={reportData.netBalance}
                  change={reportData.netBalanceChange}
                  color={reportData.netBalance >= 0 ? "green.500" : "red.500"}
                  icon="fas fa-wallet"
                  textColor={textColor}
                  borderColor={borderColor}
                  bgCard={bgCard}
                />
              </Flex>

              {/* Chart */}
              <Box height="400px" bg={bgCard} p={4} borderRadius="lg" boxShadow="sm" border="1px" borderColor={borderColor}>
                <Text mb={4} fontWeight="medium" fontSize="md">
                  Income vs Expenses
                </Text>
                <Box height="350px">
                  <LineChart chartData={reportData.chartData} chartOptions={reportData.chartOptions} />
                </Box>
              </Box>
              
              {/* Category Chart - Hidden by default, only used for PDF export */}
              <Box 
                ref={categoryChartRef} 
                mt={8} 
                p={4} 
                bg={bgCard} 
                borderRadius="lg" 
                boxShadow="sm" 
                border="1px" 
                borderColor={borderColor}
                style={{ display: 'none' }}
              >
                <Flex direction="column" mb={4}>
                  <Text color={textColor} fontSize="lg" fontWeight="bold" mb={2}>
                    Transaction Distribution by Category
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Period: {getFormattedDateRange()}
                  </Text>
                </Flex>
                
                {reportData.categoryData && reportData.categoryData.labels.length > 0 ? (
                  <Box h="400px">
                    <PieChart
                      chartData={reportData.categoryData.expenses}
                      chartOptions={{
                        chart: { type: "pie", background: "transparent" },
                        labels: reportData.categoryData.labels,
                        colors: reportData.categoryData.colors,
                        legend: {
                          position: "bottom",
                          labels: { colors: textColor }
                        },
                        dataLabels: {
                          enabled: true,
                          style: { colors: ["#fff"], fontSize: "12px", fontWeight: "bold" },
                          formatter: (val, opts) => {
                            const value = opts.w.config.series[opts.seriesIndex];
                            return "₹" + value.toFixed(0);
                          },
                        },
                        plotOptions: {
                          pie: {
                            expandOnClick: true,
                            donut: { size: "0%" },
                          },
                        },
                        tooltip: {
                          y: { formatter: (val) => "₹" + val.toFixed(2) },
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <Flex align="center" justify="center" h="400px">
                    <Text color="gray.400">No category data available</Text>
                  </Flex>
                )}
                
                {/* Category Breakdown Table */}
                {reportData.categoryData && reportData.categoryData.labels.length > 0 && (
                  <Box mt={6}>
                    <Text color={textColor} fontSize="md" fontWeight="bold" mb={3}>
                      Category Breakdown
                    </Text>
                    <Flex 
                      direction="column" 
                      border="1px" 
                      borderColor={borderColor} 
                      borderRadius="md"
                    >
                      <Flex 
                        bg={useColorModeValue("gray.50", "gray.700")} 
                        p={3} 
                        borderBottom="1px" 
                        borderColor={borderColor}
                      >
                        <Text flex="1" fontWeight="bold">Category</Text>
                        <Text flex="1" fontWeight="bold" textAlign="right">Income</Text>
                        <Text flex="1" fontWeight="bold" textAlign="right">Expenses</Text>
                        <Text flex="1" fontWeight="bold" textAlign="right">Net</Text>
                      </Flex>
                      
                      {reportData.categoryData.labels.map((label, index) => {
                        const income = reportData.categoryData.income[index];
                        const expenses = reportData.categoryData.expenses[index];
                        const net = income - expenses;
                        
                        return (
                          <Flex 
                            key={label} 
                            p={3} 
                            borderBottom="1px" 
                            borderColor={borderColor}
                            _last={{ borderBottom: "none" }}
                          >
                            <Text flex="1">{label}</Text>
                            <Text flex="1" textAlign="right" color="green.500">₹{income.toFixed(2)}</Text>
                            <Text flex="1" textAlign="right" color="red.500">₹{expenses.toFixed(2)}</Text>
                            <Text 
                              flex="1" 
                              textAlign="right" 
                              color={net >= 0 ? "green.500" : "red.500"}
                            >
                              ₹{net.toFixed(2)}
                            </Text>
                          </Flex>
                        );
                      })}
                    </Flex>
                  </Box>
                )}
              </Box>
            </>
          )}
        </CardBody>
      </Card>

      {/* Custom Date Range Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Custom Date Range</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4}>
              <FormLabel>From Date</FormLabel>
              <Input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </FormControl>
            <FormControl>
              <FormLabel>To Date</FormLabel>
              <Input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                min={customFromDate}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleCustomDateSubmit}>
              Apply
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

const SummaryCard = ({ title, amount, change, color, icon, textColor, borderColor, bgCard }) => (
  <Box p={4} bg={bgCard} borderRadius="lg" boxShadow="sm" border="1px" borderColor={borderColor} flex="1">
    <Flex justify="space-between" align="center" mb={2}>
      <Text fontSize="sm" color="gray.500">
        {title}
      </Text>
      <Box bg={`${color.replace(".500", ".50")}`} p={2} borderRadius="full">
        <Box as="span" color={color} fontSize="lg">
          <i className={icon}></i>
        </Box>
      </Box>
    </Flex>
    <Text fontSize="2xl" fontWeight="bold" color={textColor}>
      ₹{amount.toFixed(2)}
    </Text>
    <Text fontSize="sm" color={change >= 0 ? "green.500" : "red.500"}>
      {change >= 0 ? "+" : ""}
      {change.toFixed(1)}% from previous period
    </Text>
  </Box>
);
