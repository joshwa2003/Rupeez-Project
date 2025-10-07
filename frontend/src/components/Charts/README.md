# ApexCharts Implementation for Smart Money Tracker

This directory contains all ApexCharts components and services for the Smart Money Tracker application, providing modern, interactive, and responsive financial visualizations.

## 📊 **Available Chart Components**

### **Core Chart Components**

1. **ApexPieChart** - Pie charts for category breakdowns
2. **ApexBarChart** - Bar charts for time-based data and comparisons
3. **ApexLineChart** - Line charts for trend analysis
4. **ApexDonutChart** - Donut charts for percentage distributions

### **Features**

- ✅ **Responsive Design** - Automatically adapts to different screen sizes
- ✅ **Dark/Light Mode** - Seamlessly integrates with Chakra UI color modes
- ✅ **Interactive Tooltips** - Hover effects with detailed information
- ✅ **Export Functionality** - Download charts as images
- ✅ **Zoom & Pan** - Interactive chart navigation
- ✅ **Custom Styling** - Consistent with application theme
- ✅ **Accessibility** - Screen reader friendly

## 🛠 **Usage Examples**

### **Basic Pie Chart**
```jsx
import ApexPieChart from '../Charts/ApexPieChart';

<ApexPieChart
  data={[30, 25, 20, 15, 10]}
  labels={['Food', 'Transport', 'Entertainment', 'Shopping', 'Other']}
  title="Expense Categories"
  height={350}
/>
```

### **Time-based Bar Chart**
```jsx
import ApexBarChart from '../Charts/ApexBarChart';

<ApexBarChart
  data={[100, 150, 200, 180, 250]}
  categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
  title="Daily Expenses"
  height={300}
  colors={['#FF4560']}
/>
```

### **Trend Line Chart**
```jsx
import ApexLineChart from '../Charts/ApexLineChart';

<ApexLineChart
  data={[100, 120, 80, 150, 200]}
  categories={['Jan', 'Feb', 'Mar', 'Apr', 'May']}
  title="Monthly Trends"
  type="area"
  height={350}
/>
```

## 📈 **Chart Service**

The `chartService` provides data processing utilities:

### **Data Processing Functions**

- `processSpendingByCategory()` - Group transactions by category
- `processSpendingByTime()` - Group transactions by time period
- `processIncomeVsExpense()` - Compare income vs expenses
- `processTrendAnalysis()` - Analyze spending trends
- `processBudgetAnalysis()` - Compare budgets vs actual spending
- `processGroupExpenses()` - Process group expense data
- `processSavingsProgress()` - Track savings goal progress

### **Utility Functions**

- `generateColors()` - Generate color palettes
- `formatCurrency()` - Format currency values
- `getDateRange()` - Get date ranges for filtering

## 🎨 **Customization**

### **Color Themes**
```jsx
const customColors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'];

<ApexPieChart
  colors={customColors}
  // ... other props
/>
```

### **Responsive Breakpoints**
```jsx
<ApexBarChart
  responsive={[{
    breakpoint: 768,
    options: {
      chart: { height: 300 },
      dataLabels: { enabled: false }
    }
  }]}
  // ... other props
/>
```

## 📱 **Responsive Design**

All charts automatically adapt to different screen sizes:

- **Desktop** (> 1024px) - Full features with all interactions
- **Tablet** (768px - 1024px) - Optimized layout with reduced complexity
- **Mobile** (< 768px) - Simplified view with essential information

## 🔧 **Integration with Contexts**

### **Transaction Context**
```jsx
import { useTransactions } from '../../contexts/TransactionContext';

const { transactions, loading } = useTransactions();
const chartData = chartService.processSpendingByCategory(transactions);
```

### **Group Context**
```jsx
import { useGroup } from '../../contexts/GroupContext';

const { groupExpenses, groupBalances } = useGroup();
const memberData = chartService.processGroupExpenses(groupExpenses, members);
```

## 📊 **Chart Types by Use Case**

### **Financial Overview**
- **Pie Charts** - Category breakdowns
- **Donut Charts** - Percentage distributions
- **Bar Charts** - Time-based comparisons

### **Trend Analysis**
- **Line Charts** - Spending trends over time
- **Area Charts** - Cumulative spending patterns
- **Spline Charts** - Smooth trend visualization

### **Group Expenses**
- **Member Contributions** - Who spent what
- **Balance Tracking** - Who owes whom
- **Category Analysis** - Group spending patterns

### **Budget Tracking**
- **Budget vs Actual** - Performance comparison
- **Savings Progress** - Goal achievement
- **Monthly Reports** - Comprehensive analysis

## 🚀 **Performance Optimization**

- **Lazy Loading** - Charts load only when needed
- **Memoization** - Data processing is cached
- **Responsive Images** - Optimized for different devices
- **Bundle Splitting** - Charts are code-split for faster loading

## 🎯 **Best Practices**

1. **Data Validation** - Always validate data before rendering
2. **Loading States** - Show spinners while data loads
3. **Error Handling** - Graceful fallbacks for missing data
4. **Accessibility** - Include proper ARIA labels
5. **Performance** - Use React.memo for expensive components

## 🔄 **Future Enhancements**

- [ ] **Real-time Updates** - Live data streaming
- [ ] **Advanced Filtering** - Multi-dimensional filtering
- [ ] **Export Options** - PDF, Excel, CSV exports
- [ ] **Custom Dashboards** - User-configurable layouts
- [ ] **Predictive Analytics** - AI-powered insights
- [ ] **Mobile Gestures** - Touch-optimized interactions

## 📚 **Dependencies**

- `apexcharts` - Core charting library
- `react-apexcharts` - React integration
- `date-fns` - Date manipulation utilities
- `@chakra-ui/react` - UI component library

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Charts not rendering** - Check data format and props
2. **Performance issues** - Use React.memo and useMemo
3. **Responsive problems** - Verify breakpoint configurations
4. **Color mode issues** - Ensure proper theme integration

### **Debug Tips**

- Use browser dev tools to inspect chart data
- Check console for ApexCharts warnings
- Verify data structure matches expected format
- Test with different screen sizes

---

**Created for Smart Money Tracker** - Modern financial visualization with ApexCharts
