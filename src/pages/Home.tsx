import { useState, useMemo, useEffect } from "react";
import { parseLocalDate } from "@/lib/dateUtils";
import { useNavigate } from "react-router-dom";
import { useSubscriptionAutoLauncher } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { FadeIn, PageTransition } from "@/components/ui/motion";
import {
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Wallet,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useExpenses } from "@/hooks/useExpenses";
import { useDebts } from "@/hooks/useDebts";
import { useReceivables } from "@/hooks/useReceivables";
import { useIncomes } from "@/hooks/useIncomes";
import { useGoals, useGoalStats } from "@/hooks/useGoals";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useCreditCards, useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { calculateBalances } from "@/lib/balanceCalculations";
import { getExpensesForMonth } from "@/lib/recurringExpenses";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

// Layout & Components
import { AppLayout } from "@/components/layout/AppLayout";
import { BalanceHero } from "@/components/home/BalanceHero";
import { MonthlyResult } from "@/components/home/MonthlyResult";
import { AlertsSection } from "@/components/home/AlertsSection";
import { CreditCardsCarousel } from "@/components/home/CreditCardsCarousel";
import { TransactionsSection } from "@/components/home/TransactionsSection";
import { GoalsSummary } from "@/components/home/GoalsSummary";
import { BankAccountsSummary } from "@/components/home/BankAccountsSummary";
import { CryptoSummary } from "@/components/home/CryptoSummary";

// Hooks
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCryptoTotalValue, useCryptoInvestedInMonth } from "@/hooks/useCryptoWallets";

export default function Home() {
  const navigate = useNavigate();
  const { launch } = useSubscriptionAutoLauncher();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Auto launch subscriptions on mount
  useEffect(() => {
    launch();
  }, []);

  const { preferences } = useUserPreferences();

  // Fetch data
  const currentMonthArg = selectedMonth.getMonth();
  const currentYearArg = selectedMonth.getFullYear();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: expenses = [], isLoading: expenseLoading } = useExpenses("all", currentMonthArg, currentYearArg);
  const { data: debts = [], isLoading: debtLoading } = useDebts("active");
  const { data: receivables = [], isLoading: receivableLoading } = useReceivables("pending");
  const { data: incomes = [], isLoading: incomeLoading } = useIncomes(currentMonthArg, currentYearArg);
  const { data: goalStats, isLoading: goalLoading } = useGoalStats();
  const { data: goals = [] } = useGoals("all");
  const { data: creditCards = [] } = useCreditCards();
  const { data: ccInstallments = [] } = useCardInstallmentsByMonth(selectedMonth);
  const { data: bankAccounts = [] } = useBankAccounts();
  const { totalValue: cryptoTotal } = useCryptoTotalValue();
  const { data: cryptoInvested = 0 } = useCryptoInvestedInMonth(currentMonthArg, currentYearArg);
  const { data: subscriptions = [] } = useSubscriptions();

  const activeSubs = useMemo(() => subscriptions.filter(s => s.status === 'active'), [subscriptions]);

  const isLoading = profileLoading || expenseLoading || debtLoading || receivableLoading || incomeLoading || goalLoading;

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredExpenses = useMemo(() => {
    return getExpensesForMonth(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      const incomeDate = income.date ? parseLocalDate(income.date) : new Date(income.created_at);
      if (income.is_recurring === true) {
        return !isBefore(monthStart, startOfMonth(incomeDate));
      }
      return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
    });
  }, [incomes, monthStart, monthEnd]);

  const filteredReceivables = useMemo(() => {
    return receivables.filter(r => {
      // Just showing pending ones as "active" receivables
      return r.status === "pending";
    });
  }, [receivables]);

  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      const debtStart = new Date(debt.created_at);
      if (isAfter(debtStart, monthEnd)) return false;
      if (debt.is_installment && debt.total_installments) {
        const monthsFromStart = Math.floor(
          (monthStart.getTime() - debtStart.getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
        return monthsFromStart < debt.total_installments;
      }
      return true;
    });
  }, [debts, monthStart, monthEnd]);

  const totalSpent = useMemo(() => filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0), [filteredExpenses]);
  const totalIncome = useMemo(() => filteredIncomes.reduce((sum, i) => sum + Number(i.amount), 0), [filteredIncomes]);
  const totalCCInstallments = useMemo(() => ccInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0), [ccInstallments]);
  const bankTotal = useMemo(() => bankAccounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0), [bankAccounts]);

  const balanceBreakdown = useMemo(() => calculateBalances(
    filteredIncomes,
    filteredExpenses,
    filteredDebts,
    selectedMonth,
    goalStats?.totalSaved || 0,
    totalCCInstallments,
    bankTotal
  ), [filteredIncomes, filteredExpenses, filteredDebts, selectedMonth, goalStats?.totalSaved, totalCCInstallments, bankTotal]);

  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: ptBR });
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = totalIncome > 0 || totalSpent > 0 || totalCCInstallments > 0 || bankAccounts.length > 0;

  return (
    <AppLayout>
      <PageTransition className="pb-24">
        {/* Month Selector Bar - Compact */}
        <div className="px-4 py-2 flex flex-col md:flex-row md:items-center justify-between relative lg:sticky lg:top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50 lg:border-none gap-2 shadow-sm">
          {/* Greeting / Title - Desktop Only */}
          <div className="hidden lg:block">
            <h1 className="font-serif text-2xl font-semibold">Visão Geral</h1>
            <p className="text-sm text-muted-foreground">Resumo financeiro do mês.</p>
          </div>

          {/* Date Picker - Centered & Compact */}
          <div className="flex items-center justify-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/50 w-full md:w-fit mx-auto lg:mx-0 max-w-[280px]">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <button
              onClick={() => setSelectedMonth(new Date())}
              className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-background transition-all active:scale-95 flex-1 justify-center"
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="font-bold capitalize text-sm tracking-tight" data-testid="month-label">{monthLabel}</span>
            </button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="px-5 space-y-8 pt-4">
          {hasData ? (
            <>
              {/* 1. Hero Balance */}
              <FadeIn>
                <BalanceHero
                  balance={balanceBreakdown}
                  cryptoTotal={preferences.cryptoEnabled ? cryptoTotal : 0}
                  cryptoEnabled={preferences.cryptoEnabled}
                />
              </FadeIn>

              {/* 2. Monthly Summary (Income vs Expense) - High Priority */}
              <FadeIn delay={0.05}>
                <MonthlyResult
                  totalIncome={totalIncome}
                  totalSpent={totalSpent + totalCCInstallments}
                  investedAmount={preferences.cryptoEnabled ? cryptoInvested : 0}
                  subscriptionsAmount={activeSubs.reduce((sum, s) => sum + Number(s.amount), 0)}
                />
              </FadeIn>

              {/* 3. Critical Alerts */}
              <FadeIn delay={0.1}>
                <AlertsSection
                  debts={filteredDebts}
                  goals={goals}
                  creditCards={creditCards}
                  installments={ccInstallments}
                  subscriptions={activeSubs}
                  selectedMonth={selectedMonth}
                />
              </FadeIn>

              {/* 4. Credit Cards Carousel (New Highlight) */}
              {creditCards.length > 0 && (
                <FadeIn delay={0.15} className="bg-gradient-to-br from-secondary/30 to-background p-4 -mx-4 sm:mx-0 sm:rounded-3xl border-y sm:border border-border/50">
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-obligation/10 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-obligation" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Meus Cartões</h3>
                    </div>
                    <button onClick={() => navigate("/cards")} className="text-xs text-primary font-medium hover:underline">Gerenciar</button>
                  </div>
                  <CreditCardsCarousel
                    cards={creditCards}
                    installments={ccInstallments}
                    selectedMonth={selectedMonth}
                  />
                </FadeIn>
              )}

              {/* 5. Bank Accounts & Crypto */}
              <FadeIn delay={0.2} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BankAccountsSummary />
                {preferences.cryptoEnabled && <CryptoSummary />}
              </FadeIn>

              {/* 6. Goals */}
              <FadeIn delay={0.25}>
                <GoalsSummary
                  goals={goals}
                  totalSaved={goalStats?.totalSaved || 0}
                  totalTarget={goalStats?.totalTarget || 0}
                />
              </FadeIn>

              {/* 7. Recent Transactions */}
              <FadeIn delay={0.3}>
                <TransactionsSection
                  expenses={filteredExpenses}
                  incomes={filteredIncomes}
                  debts={filteredDebts}
                  receivables={filteredReceivables}
                  creditCardInstallments={ccInstallments}
                  selectedMonth={selectedMonth}
                />
              </FadeIn>
            </>
          ) : (
            <FadeIn delay={0.1} className="flex flex-col items-center justify-center py-12 px-4 text-center">
              {/* Onboarding Empty State */}
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-soft animate-pulse">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3 text-foreground">Sua liberdade começa aqui</h3>
              <p className="text-sm text-muted-foreground max-w-[280px] mb-8 leading-relaxed mx-auto">
                Para o Saldin funcionar, precisamos saber onde seu dinheiro está.
              </p>

              <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button
                  size="lg"
                  className="w-full h-14 text-base shadow-medium rounded-xl gap-2"
                  onClick={() => navigate("/banks/add")}
                >
                  <Wallet className="w-5 h-5" />
                  Configurar conta bancária
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou comece lançando</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 rounded-xl border-dashed" onClick={() => navigate("/income/add")}>
                    <TrendingUp className="w-4 h-4 mr-2 text-essential" />
                    Receita
                  </Button>
                  <Button variant="outline" className="h-12 rounded-xl border-dashed" onClick={() => navigate("/expenses/add")}>
                    <TrendingDown className="w-4 h-4 mr-2 text-impulse" />
                    Gasto
                  </Button>
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </PageTransition>
    </AppLayout >
  );
}
