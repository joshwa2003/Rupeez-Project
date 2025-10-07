import React from 'react';
import Chart from 'react-apexcharts';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

const ApexLineChart = ({ 
  data = [], 
  categories = [], 
  title = "Chart", 
  height = 350,
  colors = null,
  type = 'line', // 'line', 'area', 'spline'
  showDataLabels = false,
  yAxisTitle = "Value",
  xAxisTitle = "Time",
  strokeWidth = 2,
  fillOpacity = 0.1,
  showMarkers = true,
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
      type: type,
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
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      }
    },
    colors: chartColors,
    stroke: {
      curve: type === 'spline' ? 'smooth' : 'straight',
      width: strokeWidth,
      lineCap: 'round'
    },
    fill: {
      type: type === 'area' ? 'gradient' : 'solid',
      opacity: type === 'area' ? fillOpacity : 1,
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: chartColors.map(color => color + '20'),
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    markers: {
      size: showMarkers ? 4 : 0,
      colors: chartColors,
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6
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
      background: {
        enabled: true,
        foreColor: '#fff',
        padding: 4,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#fff',
        opacity: 0.9
      }
    },
    xaxis: {
      categories: categories,
      type: 'datetime',
      labels: {
        style: {
          colors: axisColor,
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500
        },
        datetimeUTC: false,
        format: 'MMM dd'
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
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      },
      x: {
        format: 'MMM dd, yyyy'
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
        chart: {
          height: 300
        },
        dataLabels: {
          enabled: false
        },
        markers: {
          size: 3
        }
      }
    }]
  };

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
        type={type}
        height={height}
      />
    </Box>
  );
};

export default ApexLineChart;
