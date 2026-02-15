// Utilitário de datas timezone-safe para o Brasil
// Evita deslocamento de data causado por conversão UTC via toISOString()

/**
 * Retorna uma data no formato YYYY-MM-DD usando o fuso horário LOCAL do usuário.
 * Substitui o padrão `new Date().toISOString().split('T')[0]` que pode
 * deslocar a data em fusos negativos (ex: Brasil UTC-3).
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Retorna o início do mês como string YYYY-MM-DD (local timezone).
 */
export function localMonthStart(year: number, month: number): string {
  return toLocalDateString(new Date(year, month, 1));
}

/**
 * Retorna o início do mês seguinte como string YYYY-MM-DD (local timezone).
 * Útil para queries < endOfMonth.
 */
export function localMonthEnd(year: number, month: number): string {
  return toLocalDateString(new Date(year, month + 1, 1));
}

/**
 * Cria uma Date a partir de uma data sem deslocamento de timezone.
 * Se for uma string YYYY-MM-DD, interpreta como local.
 * Se for um ISO completo (com T), usa o default do Date().
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Se for um timestamp ISO completo (com T), o construtor Date lida corretamente
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }

  const parts = dateStr.split("-");
  if (parts.length !== 3) return new Date(dateStr);

  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formata uma data no padrão brasileiro DD/MM/AAAA.
 */
export function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
