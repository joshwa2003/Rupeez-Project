import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Select,
  Button,
  Text,
  Collapse,
  IconButton,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Checkbox,
  CheckboxGroup,
  Stack,
  Badge,
  Flex,
  Divider,
  useColorModeValue,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { debounce } from 'lodash';

const TransactionSearchFilter = ({ 
  onFiltersChange, 
  initialFilters = {},
  categories = [],
  isLoading = false 
}) => {
  // Filter state
  const [filters, setFilters] = useState({
    keyword: '',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: '',
    categories: [],
    transactionType: '', // income, expense, all
    ...initialFilters
  });

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [amountRange, setAmountRange] = useState([0, 10000]);
  
  // Color mode values - matching the table background
  const bgColor = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((newFilters) => {
      onFiltersChange(newFilters);
    }, 300),
    [onFiltersChange]
  );

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Handle amount range change
  const handleAmountRangeChange = (values) => {
    setAmountRange(values);
    const newFilters = { 
      ...filters, 
      amountMin: values[0], 
      amountMax: values[1] 
    };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Handle category selection
  const handleCategoryChange = (selectedCategories) => {
    const newFilters = { ...filters, categories: selectedCategories };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      keyword: '',
      amountMin: '',
      amountMax: '',
      dateFrom: '',
      dateTo: '',
      categories: [],
      transactionType: ''
    };
    setFilters(clearedFilters);
    setAmountRange([0, 10000]);
    onFiltersChange(clearedFilters);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.keyword) count++;
    if (filters.amountMin || filters.amountMax) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.categories.length > 0) count++;
    if (filters.transactionType) count++;
    return count;
  };

  // Quick date filters
  const setQuickDateFilter = (type) => {
    const today = new Date();
    let dateFrom, dateTo;

    switch (type) {
      case 'today':
        dateFrom = dateTo = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(weekStart.getDate() + 6));
        dateFrom = weekStart.toISOString().split('T')[0];
        dateTo = weekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateFrom = monthStart.toISOString().split('T')[0];
        dateTo = monthEnd.toISOString().split('T')[0];
        break;
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);
        dateFrom = yearStart.toISOString().split('T')[0];
        dateTo = yearEnd.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    const newFilters = { ...filters, dateFrom, dateTo };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
    >
      {/* Main Search Bar */}
      <VStack spacing={4} align="stretch">
        <HStack spacing={4}>
          <InputGroup flex={1}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search transactions (e.g., 'rent', 'groceries', 'coffee')"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              isDisabled={isLoading}
            />
            {filters.keyword && (
              <InputRightElement>
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={<CloseIcon />}
                  onClick={() => handleFilterChange('keyword', '')}
                />
              </InputRightElement>
            )}
          </InputGroup>

          {/* Quick Transaction Type Filter */}
          <Select
            placeholder="All Types"
            value={filters.transactionType}
            onChange={(e) => handleFilterChange('transactionType', e.target.value)}
            maxW="150px"
            isDisabled={isLoading}
          >
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            leftIcon={showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            size="md"
          >
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge ml={2} colorScheme="blue" borderRadius="full">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          {/* Clear Filters Button */}
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="md"
              onClick={clearAllFilters}
              color="red.500"
            >
              Clear All
            </Button>
          )}
        </HStack>

        {/* Advanced Filters Panel */}
        <Collapse in={showAdvanced} animateOpacity>
          <VStack spacing={4} align="stretch" pt={4}>
            <Divider />
            
            {/* Amount Range Filter */}
            <Box>
              <Text fontWeight="semibold" mb={3} color={textColor}>
                Amount Range
              </Text>
              <VStack spacing={3}>
                <HStack spacing={4} w="full">
                  <NumberInput
                    value={filters.amountMin}
                    onChange={(value) => handleFilterChange('amountMin', value)}
                    min={0}
                    precision={2}
                    step={100}
                  >
                    <NumberInputField placeholder="Min amount" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  
                  <Text color="gray.500">to</Text>
                  
                  <NumberInput
                    value={filters.amountMax}
                    onChange={(value) => handleFilterChange('amountMax', value)}
                    min={0}
                    precision={2}
                    step={100}
                  >
                    <NumberInputField placeholder="Max amount" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </HStack>

                {/* Amount Range Slider */}
                <Box w="full" px={4}>
                  <RangeSlider
                    value={amountRange}
                    onChange={handleAmountRangeChange}
                    min={0}
                    max={50000}
                    step={100}
                    colorScheme="blue"
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="sm" color="gray.500">₹{amountRange[0]}</Text>
                    <Text fontSize="sm" color="gray.500">₹{amountRange[1]}</Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>

            {/* Date Range Filter */}
            <Box>
              <Text fontWeight="semibold" mb={3} color={textColor}>
                Date Range
              </Text>
              <VStack spacing={3}>
                {/* Quick Date Buttons */}
                <HStack spacing={2} wrap="wrap">
                  <Button size="sm" variant="outline" onClick={() => setQuickDateFilter('today')}>
                    Today
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickDateFilter('week')}>
                    This Week
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickDateFilter('month')}>
                    This Month
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickDateFilter('year')}>
                    This Year
                  </Button>
                </HStack>

                {/* Custom Date Range */}
                <HStack spacing={4} w="full">
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    placeholder="From date"
                  />
                  <Text color="gray.500">to</Text>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    placeholder="To date"
                  />
                </HStack>
              </VStack>
            </Box>

            {/* Category Filter */}
            {categories.length > 0 && (
              <Box>
                <Text fontWeight="semibold" mb={3} color={textColor}>
                  Categories
                </Text>
                <CheckboxGroup
                  value={filters.categories}
                  onChange={handleCategoryChange}
                >
                  <Stack direction="row" wrap="wrap" spacing={4}>
                    {categories.map((category) => (
                      <Checkbox key={category.id} value={category.id.toString()}>
                        <HStack spacing={2}>
                          <Box
                            w={3}
                            h={3}
                            borderRadius="full"
                            bg={category.color || 'blue.500'}
                          />
                          <Text fontSize="sm">{category.name}</Text>
                        </HStack>
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </Box>
            )}

            {/* Active Filters Summary */}
            {getActiveFilterCount() > 0 && (
              <Box>
                <Text fontWeight="semibold" mb={2} color={textColor}>
                  Active Filters
                </Text>
                <Flex wrap="wrap" gap={2}>
                  {filters.keyword && (
                    <Badge colorScheme="blue" variant="subtle">
                      Keyword: "{filters.keyword}"
                    </Badge>
                  )}
                  {(filters.amountMin || filters.amountMax) && (
                    <Badge colorScheme="green" variant="subtle">
                      Amount: ₹{filters.amountMin || 0} - ₹{filters.amountMax || '∞'}
                    </Badge>
                  )}
                  {(filters.dateFrom || filters.dateTo) && (
                    <Badge colorScheme="purple" variant="subtle">
                      Date: {filters.dateFrom || 'Start'} to {filters.dateTo || 'End'}
                    </Badge>
                  )}
                  {filters.categories.length > 0 && (
                    <Badge colorScheme="orange" variant="subtle">
                      Categories: {filters.categories.length} selected
                    </Badge>
                  )}
                  {filters.transactionType && (
                    <Badge colorScheme="red" variant="subtle">
                      Type: {filters.transactionType}
                    </Badge>
                  )}
                </Flex>
              </Box>
            )}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default TransactionSearchFilter;
