import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthRoute, OnboardingRoute, PublicRoute, LoadingScreen } from "@/components/auth/RouteGuards";
import { Suspense, lazy } from "react";
import ScrollToTop from "@/components/ScrollToTop";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const History = lazy(() => import("./pages/History"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Insights = lazy(() => import("./pages/Insights"));
const Reports = lazy(() => import("./pages/Reports"));
const Overview = lazy(() => import("./pages/Overview"));
const Pending = lazy(() => import("./pages/Pending"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const EditAccount = lazy(() => import("./pages/EditAccount"));
const AddExpense = lazy(() => import("./pages/AddExpense"));
const ExpenseDetail = lazy(() => import("./pages/ExpenseDetail"));
const EditExpense = lazy(() => import("./pages/EditExpense"));
const ConfirmExpense = lazy(() => import("./pages/ConfirmExpense"));
const Income = lazy(() => import("./pages/Income"));
const AddIncome = lazy(() => import("./pages/AddIncome"));
const ConfirmIncome = lazy(() => import("./pages/ConfirmIncome"));
const IncomeDetail = lazy(() => import("./pages/IncomeDetail"));
const EditIncome = lazy(() => import("./pages/EditIncome"));
const Debts = lazy(() => import("./pages/Debts"));
const AddDebt = lazy(() => import("./pages/AddDebt"));
const ConfirmDebt = lazy(() => import("./pages/ConfirmDebt"));
const DebtDetail = lazy(() => import("./pages/DebtDetail"));
const EditDebt = lazy(() => import("./pages/EditDebt"));
const Receivables = lazy(() => import("./pages/Receivables"));
const AddReceivable = lazy(() => import("./pages/AddReceivable"));
const ConfirmReceivable = lazy(() => import("./pages/ConfirmReceivable"));
const ReceivableDetail = lazy(() => import("./pages/ReceivableDetail"));
const EditReceivable = lazy(() => import("./pages/EditReceivable"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Goals = lazy(() => import("./pages/Goals"));
const AddGoal = lazy(() => import("./pages/AddGoal"));
const GoalDetail = lazy(() => import("./pages/GoalDetail"));
const EditGoal = lazy(() => import("./pages/EditGoal"));
const CreditCards = lazy(() => import("./pages/CreditCards"));
const AddCreditCard = lazy(() => import("./pages/AddCreditCard"));
const CreditCardDetail = lazy(() => import("./pages/CreditCardDetail"));
const ImportStatement = lazy(() => import("./pages/ImportStatement"));
const BankAccounts = lazy(() => import("./pages/BankAccounts"));
const AddBankAccount = lazy(() => import("./pages/AddBankAccount"));
const BankAccountDetail = lazy(() => import("./pages/BankAccountDetail"));
const EditBankAccount = lazy(() => import("./pages/EditBankAccount"));
const EditCreditCard = lazy(() => import("./pages/EditCreditCard"));
const BankTransfer = lazy(() => import("./pages/BankTransfer"));
const CryptoWallets = lazy(() => import("./pages/CryptoWallets"));
const AddCryptoWallet = lazy(() => import("./pages/AddCryptoWallet"));
const CryptoWalletDetail = lazy(() => import("./pages/CryptoWalletDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StyleGuide = lazy(() => import("./pages/StyleGuide"));
const Categories = lazy(() => import("./pages/Categories"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const AddSubscription = lazy(() => import("./pages/AddSubscription"));
const DebugStress = lazy(() => import("./pages/DebugStress"));

const Help = lazy(() => import("./pages/Help"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />

            {/* Auth Only (before onboarding) */}
            <Route path="/onboarding" element={<AuthRoute><Onboarding /></AuthRoute>} />

            {/* Protected Routes (require auth + onboarding) */}
            <Route path="/" element={<OnboardingRoute><Home /></OnboardingRoute>} />
            <Route path="/settings" element={<OnboardingRoute><Settings /></OnboardingRoute>} />
            <Route path="/history" element={<OnboardingRoute><History /></OnboardingRoute>} />
            <Route path="/alerts" element={<OnboardingRoute><Alerts /></OnboardingRoute>} />
            <Route path="/insights" element={<OnboardingRoute><Insights /></OnboardingRoute>} />
            <Route path="/reports" element={<OnboardingRoute><Reports /></OnboardingRoute>} />
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
            <Route path="/cards/:id/edit" element={<OnboardingRoute><EditCreditCard /></OnboardingRoute>} />
            {/* Aliases for /credit-cards */}
            <Route path="/credit-cards" element={<OnboardingRoute><CreditCards /></OnboardingRoute>} />
            <Route path="/credit-cards/:id" element={<OnboardingRoute><CreditCardDetail /></OnboardingRoute>} />
            <Route path="/cards/import" element={<OnboardingRoute><ImportStatement /></OnboardingRoute>} />

            {/* Bank Accounts */}
            <Route path="/banks" element={<OnboardingRoute><BankAccounts /></OnboardingRoute>} />
            <Route path="/banks/add" element={<OnboardingRoute><AddBankAccount /></OnboardingRoute>} />
            <Route path="/banks/:id" element={<OnboardingRoute><BankAccountDetail /></OnboardingRoute>} />
            <Route path="/banks/:id/edit" element={<OnboardingRoute><EditBankAccount /></OnboardingRoute>} />
            <Route path="/banks/transfer" element={<OnboardingRoute><BankTransfer /></OnboardingRoute>} />

            {/* Crypto Wallets */}
            <Route path="/crypto" element={<OnboardingRoute><CryptoWallets /></OnboardingRoute>} />
            <Route path="/crypto/add" element={<OnboardingRoute><AddCryptoWallet /></OnboardingRoute>} />
            <Route path="/crypto/:id" element={<OnboardingRoute><CryptoWalletDetail /></OnboardingRoute>} />

            {/* Categories */}
            <Route path="/categories" element={<OnboardingRoute><Categories /></OnboardingRoute>} />

            {/* Subscriptions */}
            <Route path="/subscriptions" element={<OnboardingRoute><Subscriptions /></OnboardingRoute>} />
            <Route path="/subscriptions/add" element={<OnboardingRoute><AddSubscription /></OnboardingRoute>} />

            {/* Support & Legal */}

            <Route path="/help" element={<OnboardingRoute><Help /></OnboardingRoute>} />
            <Route path="/terms" element={<OnboardingRoute><Terms /></OnboardingRoute>} />
            <Route path="/privacy" element={<OnboardingRoute><Privacy /></OnboardingRoute>} />

            {/* Style Guide - Public for development */}
            <Route path="/style-guide" element={<StyleGuide />} />

            {/* Debug & Simulation */}
            <Route path="/debug-stress" element={<OnboardingRoute><DebugStress /></OnboardingRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<OnboardingRoute><NotFound /></OnboardingRoute>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;