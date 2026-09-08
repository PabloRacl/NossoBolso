export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function getMonthYearLabel(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const date = new Date(clean + 'T12:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adiciona meses a uma data base preservando o dia de vencimento e tratando overflow de fim de mês.
 * Ex: 31 de janeiro + 1 mês resulta em 28 (ou 29) de fevereiro, sem avançar para março.
 */
export function addMonthsPreservingDay(baseDate: Date, offsetMonths: number): string {
  const targetYear = baseDate.getFullYear();
  const targetMonth = baseDate.getMonth() + offsetMonths;
  const originalDay = baseDate.getDate();

  const d = new Date(targetYear, targetMonth, 1);
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(originalDay, lastDayOfMonth);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(safeDay).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

