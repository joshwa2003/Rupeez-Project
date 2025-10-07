import React from 'react';
import Chart from 'react-apexcharts';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

const ApexBarChart = ({ 
  data = [], 
  categories = [], 
  title = "Chart", 
  height = 350,
  colors = null,
  horizontal = false,
  stacked = false,
  showDataLabels = true,
  yAxisTitle = "Value",
  xAxisTitle = "Category",
  ...props 
}) => {
  const textColor = useColorModeValue('#1A202C', '#FFFFFF');
  const gridColor = useColorModeValue('#E2E8F0', '#2D3748');
  const axisColor = useColorModeValue('#4A5568', '#A0AEC0');

  // Data validation
  if (!data || data.length === 0 || !categories || categories.length === 0) {
    return (
      <Box height={height} display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor} fontSize="sm">No data available</Text>
      </Box>
    );
  }

  // Default color palette
  const defaultColors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'];

  const chartColors = colors || defaultColors;

  const options = {
    chart: {
      type: 'bar',
      background: 'transparent',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: chartColors,
    plotOptions: {
      bar: {
        horizontal: horizontal,
        columnWidth: '55%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: showDataLabels,
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        colors: [textColor]
      },
      offsetY: horizontal ? 0 : -20,
      formatter: function (val) {
        return val.toLocaleString();
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: axisColor,
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500
        },
        rotate: horizontal ? 0 : -45
      },
      title: {
        text: xAxisTitle,
        style: {
          color: textColor,
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600
        }
      },
      axisBorder: {
        show: true,
        color: gridColor
      },
      axisTicks: {
        show: true,
        color: gridColor
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: axisColor,
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500
        },
        formatter: function (val) {
          return val.toLocaleString();
        }
      },
      title: {
        text: yAxisTitle,
        style: {
          color: textColor,
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600
        }
      }
    },
    fill: {
      opacity: 0.8,
      type: 'solid'
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: function (val) {
          return val.toLocaleString();
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      labels: {
        colors: axisColor,
        useSeriesColors: false
      },
      markers: {
        width: 8,
        height: 8,
        strokeWidth: 0,
        radius: 2
      }
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
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
    },
    responsive: [{
      breakpoint: 768,
      options: {
        plotOptions: {
          bar: {
            columnWidth: '70%'
          }
        },
        dataLabels: {
          enabled: false
        }
      }
    }]
  };

  // Handle stacked data
  if (stacked && Array.isArray(data[0])) {
    options.plotOptions.bar.dataLabels.position = 'center';
  }

  const series = Array.isArray(data[0]) ? data.map((series, index) => ({
    name: series.name || `Series ${index + 1}`,
    data: series.data
  })) : [{
    name: title,
    data: data
  }];

  return (
    <Box {...props}>
      <Chart
        options={options}
        series={series}
        type="bar"
        height={height}
      />
    </Box>
  );
};

export default ApexBarChart;
