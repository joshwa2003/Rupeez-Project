import React, { useState } from 'react';
import {
  Box,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Badge,
  Wrap,
  WrapItem,
  Tag,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon, CalendarIcon } from '@chakra-ui/icons';

const CalendarFilters = ({ 
  categories, 
  onCategoryFilter, 
  onSearchFilter, 
  onDateRangeFilter,
  onClearFilters,
  activeFilters 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    onSearchFilter(value);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    onCategoryFilter(value);
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    onDateRangeFilter(value);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setDateRange('');
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(Boolean).length;
  };

  return (
    <Box p={4} bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">Filters</Text>
          <HStack>
            {getActiveFilterCount() > 0 && (
              <Badge colorScheme="blue" variant="solid">
                {getActiveFilterCount()} active
              </Badge>
            )}
            <Button size="sm" variant="ghost" onClick={clearAllFilters}>
              Clear All
            </Button>
          </HStack>
        </HStack>

        <HStack spacing={4} wrap="wrap">
          {/* Search Filter */}
          <InputGroup maxW="250px">
            <InputLeftElement>
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="sm"
            />
          </InputGroup>

          {/* Category Filter */}
          <Select
            placeholder="All Categories"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            maxW="200px"
            size="sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>

          {/* Date Range Filter */}
          <Select
            placeholder="All Time"
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            maxW="150px"
            size="sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </Select>
        </HStack>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <Box>
            <Text fontSize="sm" color="gray.600" mb={2}>Active Filters:</Text>
            <Wrap spacing={2}>
              {activeFilters.search && (
                <WrapItem>
                  <Tag size="sm" colorScheme="blue">
                    Search: {activeFilters.search}
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={<CloseIcon />}
                      onClick={() => {
                        setSearchTerm('');
                        onSearchFilter('');
                      }}
                      ml={1}
                    />
                  </Tag>
                </WrapItem>
              )}
              {activeFilters.category && (
                <WrapItem>
                  <Tag size="sm" colorScheme="green">
                    Category: {activeFilters.category}
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={<CloseIcon />}
                      onClick={() => {
                        setSelectedCategory('');
                        onCategoryFilter('');
                      }}
                      ml={1}
                    />
                  </Tag>
                </WrapItem>
              )}
              {activeFilters.dateRange && (
                <WrapItem>
                  <Tag size="sm" colorScheme="purple">
                    Period: {activeFilters.dateRange}
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={<CloseIcon />}
                      onClick={() => {
                        setDateRange('');
                        onDateRangeFilter('');
                      }}
                      ml={1}
                    />
                  </Tag>
                </WrapItem>
              )}
            </Wrap>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default CalendarFilters;
