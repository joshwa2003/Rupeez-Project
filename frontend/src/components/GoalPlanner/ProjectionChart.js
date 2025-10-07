import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProjectionChart = ({ projectionData }) => {
  const data = {
    labels: projectionData.map(item => `Month ${item.month}`),
    datasets: [
      {
        label: 'Projected Savings',
        data: projectionData.map(item => item.projectedAmount),
        borderColor: 'var(--chart-line)',
        backgroundColor: 'var(--chart-bg)',
        tension: 0.1,
      },
      {
        label: 'Target Amount',
        data: projectionData.map(item => item.targetAmount),
        borderColor: 'var(--chart-target)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Savings Projection Timeline',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Months',
        },
      },
    },
  };

  return (
    <div className="projection-chart">
      <Line data={data} options={options} />
    </div>
  );
};

export default ProjectionChart;
