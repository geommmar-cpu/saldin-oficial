import { useState, useMemo } from "react";
import logoSaldin from "@/assets/logo-saldin-final.png";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
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
import { useCreditCards, useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { cn } from "@/lib/utils";
import { calculateBalances, formatCurrency } from "@/lib/balanceCalculations";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

// Home section components
import { BalanceHero } from "@/components/home/BalanceHero";
import { AlertsSection } from "@/components/home/AlertsSection";
import { CreditCardSummary } from "@/components/home/CreditCardSummary";
import { TransactionsSection } from "@/components/home/TransactionsSection";
import { GoalsSummary } from "@/components/home/GoalsSummary";
import { QuickActions } from "@/components/home/QuickActions";

export const Home = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch data
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: expenses = [], isLoading: expenseLoading } = useExpenses("all");
  const { data: debts = [], isLoading: debtLoading } = useDebts("active");
  const { data: receivables = [], isLoading: receivableLoading } = useReceivables("pending");
  const { data: incomes = [], isLoading: incomeLoading } = useIncomes();
  const { data: goalStats, isLoading: goalLoading } = useGoalStats();
  const { data: goals = [] } = useGoals("all");
  const { data: creditCards = [] } = useCreditCards();
  const { data: ccInstallments = [] } = useCardInstallmentsByMonth(selectedMonth);

  const isLoading = profileLoading || expenseLoading || debtLoading || receivableLoading || incomeLoading || goalLoading;

  // Date range
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Filter expenses by month
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.created_at);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });
  }, [expenses, monthStart, monthEnd]);

  // Filter incomes by month (including recurring)
  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      const incomeDate = new Date(income.date || income.created_at);
      if (income.is_recurring) {
        return !isBefore(monthStart, startOfMonth(incomeDate));
      }
      return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
    });
  }, [incomes, monthStart, monthEnd]);

  // Filter receivables by due date
  const filteredReceivables = useMemo(() => {
    return receivables.filter(r => {
      const dueDate = r.due_date ? new Date(r.due_date) : null;
      return dueDate ? isWithinInterval(dueDate, { start: monthStart, end: monthEnd }) : false;
    });
  }, [receivables, monthStart, monthEnd]);

  // Filter debts
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

  // Totals
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = filteredIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPendingReceivables = receivables.reduce((sum, r) => sum + Number(r.amount), 0);

  // Total de parcelas de cartão no mês (valor comprometido)
  const totalCCInstallments = ccInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);

  // Balance calculation (incluindo cartão como comprometido)
  const balanceBreakdown = calculateBalances(
    filteredIncomes,
    filteredExpenses,
    filteredDebts,
    selectedMonth,
    goalStats?.totalSaved || 0,
    totalCCInstallments
  );

  // Navigation
  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: ptBR });
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top bg-background sticky top-0 z-10 border-b border-border">
        <div className="pt-3 pb-3">
          <FadeIn>
            <button onClick={() => navigate("/")} className="flex justify-center w-full">
              <img src={logoSaldin} alt="Saldin" className="h-16 object-contain" />
            </button>
          </FadeIn>
        </div>

        {/* Month Selector */}
        <FadeIn delay={0.05}>
          <div className="flex items-center justify-between py-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium capitalize text-sm">{monthLabel}</span>
              {isCurrentMonth && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  Atual
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </FadeIn>
      </header>

      <main className="px-5 space-y-5 pt-4">
        {/* 1. SALDO LIVRE - Hero */}
        <FadeIn delay={0.1}>
          <BalanceHero
            balance={balanceBreakdown}
            totalIncome={totalIncome}
            totalSpent={totalSpent}
          />
        </FadeIn>

        {/* Quick action cards */}
        <FadeIn delay={0.12}>
          <QuickActions
            totalIncome={totalIncome}
            totalSpent={totalSpent}
            totalCardInstallments={totalCCInstallments}
            totalReceivables={totalPendingReceivables}
            selectedMonth={selectedMonth}
          />
        </FadeIn>

        {/* 2. ALERTAS */}
        <FadeIn delay={0.15}>
          <AlertsSection
            debts={filteredDebts}
            goals={goals}
            creditCards={creditCards}
            installments={ccInstallments}
            selectedMonth={selectedMonth}
          />
        </FadeIn>

        {/* 3. CARTÃO DE CRÉDITO - Fatura Atual */}
        <FadeIn delay={0.18}>
          <CreditCardSummary
            cards={creditCards}
            installments={ccInstallments}
            selectedMonth={selectedMonth}
          />
        </FadeIn>

        {/* 4. METAS */}
        <FadeIn delay={0.2}>
          <GoalsSummary
            goals={goals}
            totalSaved={goalStats?.totalSaved || 0}
            totalTarget={goalStats?.totalTarget || 0}
          />
        </FadeIn>

        {/* 5. MOVIMENTAÇÕES */}
        <FadeIn delay={0.22}>
          <TransactionsSection
            expenses={filteredExpenses}
            incomes={filteredIncomes}
            debts={filteredDebts}
            receivables={filteredReceivables}
            creditCardInstallments={ccInstallments}
            selectedMonth={selectedMonth}
          />
        </FadeIn>

        {/* Empty State */}
        {totalIncome === 0 && totalSpent === 0 && (
          <FadeIn delay={0.1}>
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Comece a organizar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione suas receitas e gastos para ter uma visão clara das suas finanças
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/income/add")}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Receita
                </Button>
                <Button variant="warm" onClick={() => navigate("/expenses/add")}>
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Gasto
                </Button>
              </div>
            </div>
          </FadeIn>
        )}
      </main>


      <BottomNav />
    </div>
  );
};

export default Home;
