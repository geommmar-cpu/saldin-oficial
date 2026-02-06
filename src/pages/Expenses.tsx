import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { ExpenseList, Expense } from "@/components/ExpenseList";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Plus, Receipt, MessageCircle, Loader2 } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Emotion types from database
type EmotionType = "essencial" | "impulso" | "pilar" | null;

export const Expenses = () => {
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
  const { data: allExpenses = [], isLoading } = useExpenses("all");
  
  // Filter expenses by selected month
  const expenses = useMemo(() => {
    return allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.created_at);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });
  }, [allExpenses, monthStart, monthEnd]);

  const openWhatsApp = () => {
    window.open("https://wa.me/5511999999999", "_blank");
  };

  const handleExpenseClick = (expense: Expense) => {
    navigate(`/expenses/${expense.id}`);
  };

  // Calculate totals
  const totalSpent = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // Group by emotion category
  const essentialExpenses = expenses.filter((e) => e.emotion === "essencial");
  const obligationExpenses = expenses.filter((e) => e.emotion === "pilar");
  const impulseExpenses = expenses.filter((e) => e.emotion === "impulso");
  const otherExpenses = expenses.filter((e) => !e.emotion);

  const essentialTotal = essentialExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const obligationTotal = obligationExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const impulseTotal = impulseExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const otherTotal = otherExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

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

  // Transform database expenses to ExpenseList format
  const transformExpense = (e: typeof expenses[0]): Expense => ({
    id: e.id,
    amount: Number(e.amount),
    description: e.description,
    category: e.emotion === "essencial" ? "essential" 
      : e.emotion === "pilar" ? "obligation" 
      : e.emotion === "impulso" ? "impulse" 
      : undefined,
   wouldDoAgain: undefined,
    source: (e.source as Expense["source"]) || "manual",
   pending: e.status === "pending",
    createdAt: new Date(e.date || e.created_at),
   establishment: undefined,
  });

  const transformedExpenses = expenses.map(transformExpense);
  const transformedEssential = essentialExpenses.map(transformExpense);
  const transformedObligation = obligationExpenses.map(transformExpense);
  const transformedImpulse = impulseExpenses.map(transformExpense);
  const transformedOther = otherExpenses.map(transformExpense);
 
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
               <h1 className="font-serif text-xl font-semibold">Gastos</h1>
               <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
             </div>
           </div>
           <Button variant="warm" size="icon" onClick={() => navigate("/expenses/add")}>
             <Plus className="w-5 h-5" />
           </Button>
         </div>
       </header>
 
       <main className="px-5 space-y-5">
         {/* Summary Card */}
         <FadeIn>
           <div className="p-4 rounded-xl bg-card border border-border shadow-soft">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 rounded-full bg-impulse/20 flex items-center justify-center">
                 <Receipt className="w-5 h-5 text-impulse" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">Gasto total do mês</p>
                 <p className="font-serif text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
               <div>
                 <p className="text-xs text-muted-foreground">Essenciais</p>
                 <p className="font-semibold text-essential">{formatCurrency(essentialTotal)}</p>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">Impulsos</p>
                 <p className="font-semibold text-impulse">{formatCurrency(impulseTotal)}</p>
               </div>
             </div>
           </div>
         </FadeIn>
 
         {/* Context Text */}
         <FadeIn delay={0.05}>
           <p className="text-sm text-muted-foreground text-center px-4">
             Acompanhe seus gastos para manter o controle financeiro.
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
 
         {/* Essential Expenses */}
         {transformedEssential.length > 0 && (
           <FadeIn delay={0.15}>
             <div>
               <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                 <span className="text-lg">✅</span> Essenciais
               </h2>
               <ExpenseList 
                 expenses={transformedEssential} 
                 onExpenseClick={handleExpenseClick} 
               />
             </div>
           </FadeIn>
         )}
 
         {/* Obligation Expenses */}
         {transformedObligation.length > 0 && (
           <FadeIn delay={0.2}>
             <div>
               <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                 <span className="text-lg">🎯</span> Pilares
               </h2>
               <ExpenseList 
                 expenses={transformedObligation} 
                 onExpenseClick={handleExpenseClick} 
               />
             </div>
           </FadeIn>
         )}
 
         {/* Impulse Expenses */}
         {transformedImpulse.length > 0 && (
          <FadeIn delay={0.25}>
             <div>
               <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                 <span className="text-lg">🔥</span> Impulsos
               </h2>
               <ExpenseList 
                 expenses={transformedImpulse} 
                 onExpenseClick={handleExpenseClick} 
               />
             </div>
           </FadeIn>
         )}
 
         {/* Other Expenses */}
         {transformedOther.length > 0 && (
           <FadeIn delay={0.35}>
             <div>
               <h2 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                 <span className="text-lg">💳</span> Outros
               </h2>
               <ExpenseList 
                 expenses={transformedOther} 
                 onExpenseClick={handleExpenseClick} 
               />
             </div>
           </FadeIn>
         )}
 
         {/* Empty State */}
         {expenses.length === 0 && (
           <FadeIn delay={0.2}>
             <div className="text-center py-12">
               <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                 <Receipt className="w-8 h-8 text-muted-foreground" />
               </div>
               <p className="text-muted-foreground mb-4">
                 Nenhum gasto registrado ainda
               </p>
               <Button variant="warm" onClick={() => navigate("/expenses/add")}>
                 <Plus className="w-4 h-4 mr-2" />
                 Adicionar gasto
               </Button>
             </div>
           </FadeIn>
         )}
       </main>
 
       <BottomNav />
     </div>
   );
 };
 
 export default Expenses;