 // Cálculos de saldo do Saldin
 // Implementa os 3 tipos de saldo: Bruto, Comprometido e Livre
 
 import { ExpenseRow } from "@/hooks/useExpenses";
 import { IncomeRow } from "@/hooks/useIncomes";
 import { DebtRow } from "@/hooks/useDebts";
 import { startOfMonth, endOfMonth, isWithinInterval, isBefore, isAfter, addMonths } from "date-fns";
 
export interface BalanceBreakdown {
  // Saldo Bruto = Receitas - Gastos já pagos
  saldoBruto: number;
  
  // Saldo Comprometido = Parcelas futuras + Dívidas ativas + Contas recorrentes
  saldoComprometido: number;
  
  // Dinheiro guardado em metas
  saldoGuardado: number;
  
  // Saldo Livre = Saldo Bruto - Saldo Comprometido - Saldo Guardado
  saldoLivre: number;
  
  // Detalhamento
  detalhes: {
    receitasTotal: number;
    gastosTotal: number;
    dividasAtivas: number;
    parcelasFuturas: number;
    contasRecorrentes: number;
    valoresParaTerceiros: number;
    metasGuardadas: number;
  };
}
 
 export interface MonthlyProjection {
   month: Date;
   label: string;
   saldoProjetado: number;
   compromissos: number;
   isNegative: boolean;
 }
 
// Calcular os 3 saldos para um período
// Nota: goalsSaved é passado como parâmetro opcional para não acoplar a lib aos hooks
// ccInstallmentsTotal: total de parcelas de cartão de crédito no mês (compromisso futuro)
export function calculateBalances(
  incomes: IncomeRow[],
  expenses: ExpenseRow[],
  debts: DebtRow[],
  selectedMonth: Date,
  goalsSaved: number = 0,
  ccInstallmentsTotal: number = 0
): BalanceBreakdown {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  // Filtrar receitas do mês (incluindo recorrentes)
  // Nota: já recebemos os dados filtrados, apenas garantimos a lógica aqui também
  const filteredIncomes = incomes.filter(income => {
    const incomeDate = new Date(income.date || income.created_at);
    
    if (income.is_recurring) {
      // Show in all months from the start date onwards
      const incomeStart = startOfMonth(incomeDate);
      return !isBefore(monthStart, incomeStart);
    }
    
    return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
  });
  
  // Filtrar gastos do mês (já vem filtrado, mas garantimos)
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date || expense.created_at);
    return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
  });
  
  // Calcular dívidas ativas no mês
  const activeDebts = debts.filter(debt => {
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
   
   // Totais
   const receitasTotal = filteredIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
   const gastosTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
   const dividasAtivas = activeDebts.reduce((sum, d) => sum + Number(d.installment_amount || 0), 0);
   
   // Calcular parcelas futuras (próximos 3 meses)
   let parcelasFuturas = 0;
   const futureMonths = [1, 2, 3].map(n => addMonths(selectedMonth, n));
   
   debts.forEach(debt => {
     if (debt.is_installment && debt.total_installments) {
       const debtStart = new Date(debt.created_at);
       const remainingInstallments = debt.total_installments - (debt.current_installment || 0);
       
       futureMonths.forEach((futureMonth, index) => {
         if (index < remainingInstallments) {
           parcelasFuturas += Number(debt.installment_amount || 0);
         }
       });
     }
   });
   
   // Contas recorrentes (estimativa baseada em gastos marcados como essencial/pilar)
   const contasRecorrentes = filteredExpenses
     .filter(e => e.emotion === "essencial" || e.emotion === "pilar")
     .reduce((sum, e) => sum + Number(e.amount), 0);
   
   // Valores para terceiros (placeholder - pode ser expandido)
   const valoresParaTerceiros = 0;
   
   // Cálculos principais
   const saldoBruto = receitasTotal - gastosTotal;
   const saldoComprometido = dividasAtivas + valoresParaTerceiros + ccInstallmentsTotal;
   const saldoGuardado = goalsSaved;
   const saldoLivre = saldoBruto - saldoComprometido - saldoGuardado;
   
   return {
     saldoBruto,
     saldoComprometido,
     saldoGuardado,
     saldoLivre,
     detalhes: {
       receitasTotal,
       gastosTotal,
       dividasAtivas,
       parcelasFuturas,
       contasRecorrentes,
       valoresParaTerceiros,
       metasGuardadas: goalsSaved,
     },
   };
 }
 
 // Calcular projeção para os próximos meses
 export function calculateMonthlyProjection(
   incomes: IncomeRow[],
   expenses: ExpenseRow[],
   debts: DebtRow[],
   startMonth: Date,
   monthsAhead: number = 6
 ): MonthlyProjection[] {
   const projections: MonthlyProjection[] = [];
   
   for (let i = 0; i <= monthsAhead; i++) {
     const targetMonth = addMonths(startMonth, i);
     const balance = calculateBalances(incomes, expenses, debts, targetMonth);
     
     projections.push({
       month: targetMonth,
       label: targetMonth.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
       saldoProjetado: balance.saldoLivre,
       compromissos: balance.saldoComprometido,
       isNegative: balance.saldoLivre < 0,
     });
   }
   
   return projections;
 }
 
 // Formatar moeda
 export function formatCurrency(value: number): string {
   return new Intl.NumberFormat("pt-BR", {
     style: "currency",
     currency: "BRL",
   }).format(value);
 }
 
 // Formatar moeda curta (para cards compactos)
 export function formatShortCurrency(value: number): string {
   if (Math.abs(value) >= 1000) {
     return `R$ ${(value / 1000).toFixed(1).replace(".", ",")}k`;
   }
   return formatCurrency(value);
 }