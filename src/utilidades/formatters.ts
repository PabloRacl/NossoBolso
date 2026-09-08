export function formatBRL(value: number, isPrivacy?: boolean): string {
  if (isPrivacy) return 'R$ •••••';
  const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeValue);
}

export function formatPercent(value: number): string {
  const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;
  return `${safeValue.toFixed(1)}%`;
}
