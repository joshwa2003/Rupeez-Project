// import
import React, { Component }  from 'react';
import Dashboard from "views/Dashboard/Dashboard.js";
import Tables from "views/Dashboard/Tables.js";
import Billing from "views/Dashboard/Billing.js";
import Profile from "views/Dashboard/Profile.js";
import AddTransaction from "views/Dashboard/AddTransaction.js";
import Categories from "views/Dashboard/Categories.js";
import TransactionChart from "views/Dashboard/TransactionChart.js";
import SavingsGoals from "views/Dashboard/SavingsGoals.js";
import Budgets from "views/Dashboard/Budgets.js";
import CurrencyConverter from "views/Dashboard/CurrencyConverter.js";
import ExpenseCalendar from "views/Dashboard/ExpenseCalendar.js";
import GroupManager from "views/Dashboard/GroupManager.js";
import ReportDashboard from "views/Dashboard/ReportDashboard.js";
import RecurringTransactions from "views/Dashboard/RecurringTransactions.js";
import SignIn from "views/Pages/SignIn.js";
import SignUp from "views/Pages/SignUp.js";

import {
  HomeIcon,
  StatsIcon,
  CreditIcon,
  PersonIcon,
  DocumentIcon,
  RocketIcon,
} from "components/Icons/Icons";

var dashRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: <HomeIcon color='inherit' />,
    component: Dashboard,
    layout: "/admin",
  },
  {
    path: "/tables",
    name: "Tables",
    icon: <StatsIcon color='inherit' />,
    component: Tables,
    layout: "/admin",
    hidden: true,
  },
  {
    path: "/billing",
    name: "Billing",
    icon: <CreditIcon color='inherit' />,
    component: Billing,
    layout: "/admin",
    hidden: true,
  },
  {
    path: "/categories",
    name: "Categories",
    icon: <StatsIcon color='inherit' />,
    component: Categories,
    layout: "/admin",
  },
  {
    path: "/transaction-chart",
    name: "Transaction Chart",
    icon: <StatsIcon color='inherit' />,
    component: TransactionChart,
    layout: "/admin",
  },
  {
    path: "/savings-goals",
    name: "Savings Goals",
    icon: <RocketIcon color='inherit' />,
    component: SavingsGoals,
    layout: "/admin",
  },
  {
    path: "/budgets",
    name: "Budget Alerts",
    icon: <CreditIcon color='inherit' />,
    component: Budgets,
    layout: "/admin",
  },
  {
    path: "/currency-converter",
    name: "Currency Converter",
    icon: <CreditIcon color='inherit' />,
    component: CurrencyConverter,
    layout: "/admin",
  },
  {
    path: "/expense-calendar",
    name: "Expense Calendar",
    icon: <StatsIcon color='inherit' />,
    component: ExpenseCalendar,
    layout: "/admin",
  },
  {
    path: "/group-manager",
    name: "Group Expenses",
    icon: <PersonIcon color='inherit' />,
    component: GroupManager,
    layout: "/admin",
  },
  {
    path: "/report-dashboard",
    name: "Report Dashboard",
    icon: <StatsIcon color='inherit' />,
    component: ReportDashboard,
    layout: "/admin",
  },
  {
    path: "/recurring-transactions",
    name: "Recurring Transactions",
    icon: <DocumentIcon color='inherit' />,
    component: RecurringTransactions,
    layout: "/admin",
  },
  // Hidden route - not shown in sidebar but accessible via direct URL
  {
    path: "/add-transaction",
    name: "Add Transaction",
    icon: <DocumentIcon color='inherit' />,
    component: AddTransaction,
    layout: "/admin",
    hidden: true, // This will prevent it from showing in sidebar
  },
  {
    name: "ACCOUNT PAGES",
    category: "account",
    state: "pageCollapse",
    hidden: true,
    views: [
      {
        path: "/profile",
        name: "Profile",
        icon: <PersonIcon color='inherit' />,
        secondaryNavbar: true,
        component: Profile,
        layout: "/admin",
      },
      {
        path: "/signin",
        name: "Sign In",
        icon: <DocumentIcon color='inherit' />,
        component: SignIn,
        layout: "/auth",
        hidden: true,
      },
      {
        path: "/signup",
        name: "Sign Up",
        icon: <RocketIcon color='inherit' />,
        component: SignUp,
        layout: "/auth",
        hidden: true,
      },
    ],
  },
];
export default dashRoutes;
