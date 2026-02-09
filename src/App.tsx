import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthRoute, OnboardingRoute, PublicRoute } from "@/components/auth/RouteGuards";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Alerts from "./pages/Alerts";
import Insights from "./pages/Insights";
import Overview from "./pages/Overview";
import Pending from "./pages/Pending";
import Onboarding from "./pages/Onboarding";
import EditAccount from "./pages/EditAccount";
import AddExpense from "./pages/AddExpense";
import ExpenseDetail from "./pages/ExpenseDetail";
import EditExpense from "./pages/EditExpense";
import ConfirmExpense from "./pages/ConfirmExpense";
import Income from "./pages/Income";
import AddIncome from "./pages/AddIncome";
import ConfirmIncome from "./pages/ConfirmIncome";
import IncomeDetail from "./pages/IncomeDetail";
import EditIncome from "./pages/EditIncome";
import Debts from "./pages/Debts";
import AddDebt from "./pages/AddDebt";
import ConfirmDebt from "./pages/ConfirmDebt";
import DebtDetail from "./pages/DebtDetail";
import EditDebt from "./pages/EditDebt";
import Receivables from "./pages/Receivables";
import AddReceivable from "./pages/AddReceivable";
import ConfirmReceivable from "./pages/ConfirmReceivable";
import ReceivableDetail from "./pages/ReceivableDetail";
import EditReceivable from "./pages/EditReceivable";
import Expenses from "./pages/Expenses";
import Goals from "./pages/Goals";
import AddGoal from "./pages/AddGoal";
import GoalDetail from "./pages/GoalDetail";
import EditGoal from "./pages/EditGoal";
import CreditCards from "./pages/CreditCards";
import AddCreditCard from "./pages/AddCreditCard";
import CreditCardDetail from "./pages/CreditCardDetail";
import ImportStatement from "./pages/ImportStatement";
import BankAccounts from "./pages/BankAccounts";
import AddBankAccount from "./pages/AddBankAccount";
import BankAccountDetail from "./pages/BankAccountDetail";
import BankTransfer from "./pages/BankTransfer";
import NotFound from "./pages/NotFound";
import StyleGuide from "./pages/StyleGuide";
import Categories from "./pages/Categories";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
          
          {/* Auth Only (before onboarding) */}
          <Route path="/onboarding" element={<AuthRoute><Onboarding /></AuthRoute>} />
          
          {/* Protected Routes (require auth + onboarding) */}
          <Route path="/" element={<OnboardingRoute><Home /></OnboardingRoute>} />
          <Route path="/settings" element={<OnboardingRoute><Settings /></OnboardingRoute>} />
          <Route path="/history" element={<OnboardingRoute><History /></OnboardingRoute>} />
          <Route path="/alerts" element={<OnboardingRoute><Alerts /></OnboardingRoute>} />
          <Route path="/insights" element={<OnboardingRoute><Insights /></OnboardingRoute>} />
          <Route path="/overview" element={<OnboardingRoute><Overview /></OnboardingRoute>} />
          <Route path="/pending" element={<OnboardingRoute><Pending /></OnboardingRoute>} />
          <Route path="/account/edit" element={<OnboardingRoute><EditAccount /></OnboardingRoute>} />
          
          {/* Expenses */}
          <Route path="/expenses" element={<OnboardingRoute><Expenses /></OnboardingRoute>} />
          <Route path="/expenses/add" element={<OnboardingRoute><AddExpense /></OnboardingRoute>} />
          <Route path="/expenses/:id" element={<OnboardingRoute><ExpenseDetail /></OnboardingRoute>} />
          <Route path="/expenses/:id/edit" element={<OnboardingRoute><EditExpense /></OnboardingRoute>} />
          <Route path="/confirm/:id" element={<OnboardingRoute><ConfirmExpense /></OnboardingRoute>} />
          
          {/* Income */}
          <Route path="/income" element={<OnboardingRoute><Income /></OnboardingRoute>} />
          <Route path="/income/add" element={<OnboardingRoute><AddIncome /></OnboardingRoute>} />
          <Route path="/income/confirm" element={<OnboardingRoute><ConfirmIncome /></OnboardingRoute>} />
          <Route path="/income/:id" element={<OnboardingRoute><IncomeDetail /></OnboardingRoute>} />
          <Route path="/income/:id/edit" element={<OnboardingRoute><EditIncome /></OnboardingRoute>} />
          
          {/* Debts */}
          <Route path="/debts" element={<OnboardingRoute><Debts /></OnboardingRoute>} />
          <Route path="/debts/add" element={<OnboardingRoute><AddDebt /></OnboardingRoute>} />
          <Route path="/debts/confirm" element={<OnboardingRoute><ConfirmDebt /></OnboardingRoute>} />
          <Route path="/debts/:id" element={<OnboardingRoute><DebtDetail /></OnboardingRoute>} />
          <Route path="/debts/:id/edit" element={<OnboardingRoute><EditDebt /></OnboardingRoute>} />
          
          {/* Receivables */}
          <Route path="/receivables" element={<OnboardingRoute><Receivables /></OnboardingRoute>} />
          <Route path="/receivables/add" element={<OnboardingRoute><AddReceivable /></OnboardingRoute>} />
          <Route path="/receivables/confirm" element={<OnboardingRoute><ConfirmReceivable /></OnboardingRoute>} />
          <Route path="/receivables/:id" element={<OnboardingRoute><ReceivableDetail /></OnboardingRoute>} />
          <Route path="/receivables/:id/edit" element={<OnboardingRoute><EditReceivable /></OnboardingRoute>} />
          
          {/* Goals */}
          <Route path="/goals" element={<OnboardingRoute><Goals /></OnboardingRoute>} />
          <Route path="/goals/add" element={<OnboardingRoute><AddGoal /></OnboardingRoute>} />
          <Route path="/goals/:id" element={<OnboardingRoute><GoalDetail /></OnboardingRoute>} />
          <Route path="/goals/:id/edit" element={<OnboardingRoute><EditGoal /></OnboardingRoute>} />
          
          {/* Credit Cards */}
          <Route path="/cards" element={<OnboardingRoute><CreditCards /></OnboardingRoute>} />
          <Route path="/cards/add" element={<OnboardingRoute><AddCreditCard /></OnboardingRoute>} />
          <Route path="/cards/:id" element={<OnboardingRoute><CreditCardDetail /></OnboardingRoute>} />
          {/* Aliases for /credit-cards */}
          <Route path="/credit-cards" element={<OnboardingRoute><CreditCards /></OnboardingRoute>} />
          <Route path="/credit-cards/:id" element={<OnboardingRoute><CreditCardDetail /></OnboardingRoute>} />
          <Route path="/cards/import" element={<OnboardingRoute><ImportStatement /></OnboardingRoute>} />
          
          {/* Bank Accounts */}
          <Route path="/banks" element={<OnboardingRoute><BankAccounts /></OnboardingRoute>} />
          <Route path="/banks/add" element={<OnboardingRoute><AddBankAccount /></OnboardingRoute>} />
          <Route path="/banks/:id" element={<OnboardingRoute><BankAccountDetail /></OnboardingRoute>} />
          <Route path="/banks/transfer" element={<OnboardingRoute><BankTransfer /></OnboardingRoute>} />
          
          {/* Categories */}
          <Route path="/categories" element={<OnboardingRoute><Categories /></OnboardingRoute>} />
          
          {/* Support & Legal */}
          <Route path="/help" element={<OnboardingRoute><Help /></OnboardingRoute>} />
          <Route path="/terms" element={<OnboardingRoute><Terms /></OnboardingRoute>} />
          <Route path="/privacy" element={<OnboardingRoute><Privacy /></OnboardingRoute>} />
          
          {/* Style Guide - Public for development */}
          <Route path="/style-guide" element={<StyleGuide />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;