import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data for demonstration
const mockData = {
  // Daily data for trend chart
  trend: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    income: [25000, 32000, 18000, 27000, 42000, 15000, 22000],
    expense: [18000, 24000, 22000, 17000, 35000, 25000, 20000]
  },
  // Category data for pie/bar chart
  categories: [
    { name: 'Food', amount: 12500 },
    { name: 'Rent', amount: 25000 },
    { name: 'Utilities', amount: 8000 },
    { name: 'Entertainment', amount: 5500 },
    { name: 'Transportation', amount: 7000 }
  ],
  // Comparison with previous period
  comparison: {
    currentTotal: 161000,
    previousTotal: 145000,
    percentageChange: 11.03
  }
};

// Helper function to format amounts in Indian Rupee format
const formatIndianRupee = (amount) => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
  return formatter.format(amount);
};

const FinancialCharts = () => {
  // Income vs Expense Trend Chart Configuration
  const trendChartData = {
    labels: mockData.trend.labels,
    datasets: [
      {
        label: 'Income',
        data: mockData.trend.income,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Expense',
        data: mockData.trend.expense,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatIndianRupee(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatIndianRupee(value);
          }
        }
      }
    }
  };

  // Category-wise Spending Distribution Chart Configuration
  const categoryLabels = mockData.categories.map(cat => cat.name);
  const categoryAmounts = mockData.categories.map(cat => cat.amount);
  const categoryColors = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)'
  ];

  const pieChartData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryAmounts,
        backgroundColor: categoryColors,
        borderColor: categoryColors.map(color => color.replace('0.7', '1')),
        borderWidth: 1
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${formatIndianRupee(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Bar Chart Alternative for Category Spending
  const barChartData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Spending by Category',
        data: categoryAmounts,
        backgroundColor: categoryColors,
        borderColor: categoryColors.map(color => color.replace('0.7', '1')),
        borderWidth: 1
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatIndianRupee(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatIndianRupee(value);
          }
        }
      }
    }
  };

  // Determine if the comparison is an increase or decrease
  const isIncrease = mockData.comparison.percentageChange > 0;
  const percentageChangeAbs = Math.abs(mockData.comparison.percentageChange).toFixed(1);

  return (
    <div className="w-full p-4">
      {/* Main container with Tailwind styling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income vs Expense Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Income vs Expense Trend</h2>
          <div className="h-64">
            <Line data={trendChartData} options={trendChartOptions} />
          </div>
        </div>
        
        {/* Category-wise Spending Distribution */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
          <div className="h-64">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
        
        {/* Comparison Trend Indicator */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Spending Comparison</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="text-xl font-bold">{formatIndianRupee(mockData.comparison.currentTotal)}</p>
            </div>
            
            <div className="flex items-center">
              {isIncrease ? (
                <div className="flex items-center text-red-500">
                  <ArrowUpIcon className="h-5 w-5 mr-1" />
                  <span className="text-xl font-bold">{percentageChangeAbs}%</span>
                </div>
              ) : (
                <div className="flex items-center text-green-500">
                  <ArrowDownIcon className="h-5 w-5 mr-1" />
                  <span className="text-xl font-bold">{percentageChangeAbs}%</span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Previous Period</p>
              <p className="text-xl font-bold">{formatIndianRupee(mockData.comparison.previousTotal)}</p>
            </div>
          </div>
          
          {/* Small bar chart showing the comparison */}
          <div className="h-24 mt-4">
            <Bar 
              data={{
                labels: ['Previous', 'Current'],
                datasets: [{
                  data: [mockData.comparison.previousTotal, mockData.comparison.currentTotal],
                  backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    isIncrease ? 'rgba(255, 99, 132, 0.7)' : 'rgba(75, 192, 192, 0.7)'
                  ]
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return formatIndianRupee(context.parsed.y);
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatIndianRupee(value);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialCharts;