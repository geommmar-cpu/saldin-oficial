import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { IncomeList } from "@/components/IncomeList";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Plus, Wallet, MessageCircle, Loader2 } from "lucide-react";
import { useIncomes, useIncomeStats, IncomeRow } from "@/hooks/useIncomes";
import { startOfMonth, endOfMonth, isWithinInterval, isBefore, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Map database income_type to display categories
const isFixedType = (type: string) => ["salary"].includes(type);
const isVariableType = (type: string) => ["freelance", "investment", "gift", "other"].includes(type);

export const Income = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get selected month from navigation state, fallback to current month
  const selectedMonth = useMemo(() => {
    const stateMonth = location.state?.selectedMonth;
    return stateMonth ? new Date(stateMonth) : new Date();
  }, [location.state?.selectedMonth]);
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Fetch real data from Supabase
  const { data: allIncomes = [], isLoading } = useIncomes();
  const { data: stats } = useIncomeStats();
  
  // Filter incomes by selected month (considering recurring)
  const incomes = useMemo(() => {
    return allIncomes.filter(income => {
      const incomeDate = new Date(income.date || income.created_at);
      
      // For recurring incomes: show if the income started before or during this month
      if (income.is_recurring) {
        const incomeStart = startOfMonth(incomeDate);
        return !isBefore(monthStart, incomeStart);
      }
      
      // For non-recurring: only show in the month it was created
      return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
    });
  }, [allIncomes, monthStart, monthEnd]);

  const openWhatsApp = () => {
    window.open("https://wa.me/5511999999999", "_blank");
  };

  const handleIncomeClick = (income: IncomeRow) => {
    navigate(`/income/${income.id}`, { state: { income } });
  };

  const fixedIncomes = incomes.filter((i) => isFixedType(i.type));
  const variableIncomes = incomes.filter((i) => isVariableType(i.type));

  // Calculate totals from filtered incomes
  const totalFixed = fixedIncomes.reduce((acc, i) => acc + Number(i.amount), 0);
  const totalVariable = variableIncomes.reduce((acc, i) => acc + Number(i.amount), 0);
  
  const totalIncome = totalFixed + totalVariable;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Get month name from selected month
  const currentMonth = format(selectedMonth, "MMMM yyyy", { locale: ptBR });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <BottomNav />
      </div>
    );
  }

  // Transform IncomeRow to Income type expected by IncomeList
  const transformedFixedIncomes = fixedIncomes.map(i => ({
    id: i.id,
    amount: Number(i.amount),
    description: i.description,
    type: "fixed" as const,
    source: "manual" as const,
    recurring: i.is_recurring,
    createdAt: new Date(i.created_at),
  }));

  const transformedVariableIncomes = variableIncomes.map(i => ({
    id: i.id,
    amount: Number(i.amount),
    description: i.description,
    type: "variable" as const,
    source: "manual" as const,
    recurring: i.is_recurring,
    createdAt: new Date(i.created_at),
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-semibold">Receitas</h1>
              <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
            </div>
          </div>
          <Button variant="warm" size="icon" onClick={() => navigate("/income/add")}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Summary Card */}
        <FadeIn>
          <div className="p-4 rounded-xl bg-card border border-border shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-essential/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-essential" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita total do mês</p>
                <p className="font-serif text-2xl font-semibold">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Fixa</p>
                <p className="font-semibold">{formatCurrency(totalFixed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Variável</p>
                <p className="font-semibold">{formatCurrency(totalVariable)}</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Context Text */}
        <FadeIn delay={0.05}>
          <p className="text-sm text-muted-foreground text-center px-4">
            Sua receita é a base para avaliar seus gastos. Quanto mais clara, melhor a consciência.
          </p>
        </FadeIn>

        {/* WhatsApp Tip - Discrete */}
        <FadeIn delay={0.1}>
          <button
            onClick={openWhatsApp}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Também pode registrar via WhatsApp</span>
          </button>
        </FadeIn>

        {/* Fixed Income List */}
        {transformedFixedIncomes.length > 0 && (
          <FadeIn delay={0.15}>
            <div>
              <h2 className="font-medium text-sm text-muted-foreground mb-2">Receita Fixa</h2>
              <IncomeList 
                incomes={transformedFixedIncomes} 
                onIncomeClick={(income) => {
                  const original = fixedIncomes.find(i => i.id === income.id);
                  if (original) handleIncomeClick(original);
                }} 
              />
            </div>
          </FadeIn>
        )}

        {/* Variable Income List */}
        {transformedVariableIncomes.length > 0 && (
          <FadeIn delay={0.2}>
            <div>
              <h2 className="font-medium text-sm text-muted-foreground mb-2">Receita Variável</h2>
              <IncomeList 
                incomes={transformedVariableIncomes} 
                onIncomeClick={(income) => {
                  const original = variableIncomes.find(i => i.id === income.id);
                  if (original) handleIncomeClick(original);
                }} 
              />
            </div>
          </FadeIn>
        )}

        {/* Empty State */}
        {incomes.length === 0 && (
          <FadeIn delay={0.2}>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                Nenhuma receita registrada ainda
              </p>
              <Button variant="warm" onClick={() => navigate("/income/add")}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar receita
              </Button>
            </div>
          </FadeIn>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Income;
