import React from 'react';
import Chart from 'react-apexcharts';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

const ApexPieChart = ({ 
  data = [], 
  labels = [], 
  title = "Chart", 
  height = 350,
  colors = null,
  showLegend = true,
  showDataLabels = true,
  ...props 
}) => {
  const textColor = useColorModeValue('#1A202C', '#FFFFFF');
  const legendColor = useColorModeValue('#4A5568', '#A0AEC0');

  // Data validation
  if (!data || data.length === 0 || !labels || labels.length === 0) {
    return (
      <Box height={height} display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor} fontSize="sm">No data available</Text>
      </Box>
    );
  }

  // Ensure data and labels have the same length
  const validData = data.slice(0, labels.length);
  const validLabels = labels.slice(0, data.length);

  // Default color palette
  const defaultColors = [
    '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
    '#3F51B5', '#03A9F4', '#4CAF50', '#F9CE1D', '#FF9800',
    '#9C27B0', '#E91E63', '#607D8B', '#795548', '#FFC107'
  ];

  const chartColors = colors || defaultColors;

  const options = {
    chart: {
      type: 'pie',
      background: 'transparent',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      }
    },
    colors: chartColors,
    labels: validLabels,
    legend: {
      show: showLegend,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      labels: {
        colors: legendColor,
        useSeriesColors: false
      },
      markers: {
        width: 8,
        height: 8,
        strokeWidth: 0,
        radius: 2
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    dataLabels: {
      enabled: showDataLabels,
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        colors: ['#fff']
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: '#000',
        opacity: 0.45
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: textColor,
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '24px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              color: textColor,
              offsetY: 16,
              formatter: function (val) {
                return val + '%'
              }
            },
            total: {
              show: true,
              showAlways: false,
              label: 'Total',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: textColor,
              formatter: function (w) {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return total.toLocaleString();
              }
            }
          }
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    tooltip: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: function (val, { seriesIndex, w }) {
          const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
          const percentage = ((val / total) * 100).toFixed(1);
          return `${val.toLocaleString()} (${percentage}%)`;
        }
      }
    },
    title: {
      text: title,
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        color: textColor
      }
    }
  };

  const series = validData;

  return (
    <Box {...props}>
      <Chart
        options={options}
        series={series}
        type="pie"
        height={height}
      />
    </Box>
  );
};

export default ApexPieChart;

