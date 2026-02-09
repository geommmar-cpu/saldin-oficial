// Utilitário para expandir gastos parcelados/recorrentes em registros virtuais
// para que apareçam nos meses futuros correspondentes

import { ExpenseRow } from "@/hooks/useExpenses";
import { startOfMonth, endOfMonth, addMonths, isWithinInterval, isBefore } from "date-fns";

/**
 * Filtra gastos para um mês, incluindo parcelas futuras de gastos parcelados.
 * 
 * - Gastos normais (is_installment = false): aparecem apenas no mês da data original.
 * - Gastos parcelados (is_installment = true, total_installments > 0): aparecem no mês
 *   original (parcela 1) e nos meses seguintes até completar total_installments.
 * 
 * Retorna ExpenseRow[] com campos ajustados para o mês virtual (installment_number, date).
 */
export function getExpensesForMonth(
  expenses: ExpenseRow[],
  selectedMonth: Date
): ExpenseRow[] {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const result: ExpenseRow[] = [];

  expenses.forEach(expense => {
    const expenseDate = new Date(expense.date || expense.created_at);
    const expenseMonthStart = startOfMonth(expenseDate);

    if (expense.is_installment && expense.total_installments && expense.total_installments > 1) {
      // Calcular qual parcela cai neste mês
      const monthsDiff = (monthStart.getFullYear() - expenseMonthStart.getFullYear()) * 12
        + (monthStart.getMonth() - expenseMonthStart.getMonth());

      // Parcela começa em 1 (mês original), vai até total_installments
      if (monthsDiff >= 0 && monthsDiff < expense.total_installments) {
        const installmentNumber = monthsDiff + 1;
        result.push({
          ...expense,
          installment_number: installmentNumber,
          // Ajustar a data para o mês virtual (mantém o dia original)
          date: new Date(
            monthStart.getFullYear(),
            monthStart.getMonth(),
            Math.min(expenseDate.getDate(), monthEnd.getDate())
          ).toISOString().split("T")[0],
        });
      }
    } else {
      // Gasto normal: filtrar apenas pelo mês
      if (isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })) {
        result.push(expense);
      }
    }
  });

  return result;
}
