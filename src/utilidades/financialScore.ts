import { Transaction, Wallet, DebtContract } from '../tipos';

export interface FinancialScoreBreakdown {
  reserveScore: number;
  debtScore: number;
  savingsScore: number;
  walletScore: number;
}

export type FinancialHealthLevel = 'EXCELENTE' | 'BOM' | 'ATENCAO' | 'CRITICO';

export interface FinancialHealthScoreResult {
  score: number;
  level: FinancialHealthLevel;
  levelColor: string;
  levelBadgeStyle: string;
  breakdown: FinancialScoreBreakdown;
  recommendations: string[];
}

/**
 * Calcula a Pontuação de Saúde Financeira (0 a 1.000 pontos) de forma unificada e pura.
 * Pilares:
 * 1. Reserva de Emergência (300 pts)
 * 2. Comprometimento de Dívidas (300 pts)
 * 3. Taxa de Poupança / Retenção (200 pts)
 * 4. Diversificação de Carteiras (200 pts)
 */
export function calculateFinancialHealthScore(
  transactions: Transaction[],
  wallets: Wallet[],
  debtContracts: DebtContract[]
): FinancialHealthScoreResult {
  // 1. Reserva de Emergência (300 pts)
  const savingsBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpensesEst = Math.max(totalExpenses, 3000);
  const monthsOfReserve = monthlyExpensesEst > 0 ? savingsBalance / monthlyExpensesEst : 0;
  const reserveScore = Math.min(Math.round((monthsOfReserve / 6) * 300), 300);

  // 2. Comprometimento de Dívida (300 pts)
  const totalDebt = debtContracts.reduce(
    (acc, d) => acc + (d.totalAmount || (d.installmentAmount * d.totalInstallments) || 0),
    0
  );
  const debtRatio = savingsBalance > 0 ? totalDebt / savingsBalance : 1;
  let debtScore = 300;
  if (debtRatio > 2) debtScore = 50;
  else if (debtRatio > 1) debtScore = 150;
  else if (debtRatio > 0.5) debtScore = 220;

  // 3. Taxa de Retenção de Poupança (200 pts)
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const savingsRate = income > 0 ? Math.max((income - totalExpenses) / income, 0) : 0.15;
  const savingsScore = Math.min(Math.round((savingsRate / 0.3) * 200), 200);

  // 4. Diversificação de Carteiras (200 pts)
  const walletScore = Math.min(wallets.length * 66, 200);

  const totalScore = Math.min(reserveScore + debtScore + savingsScore + walletScore, 1000);

  let level: FinancialHealthLevel = 'EXCELENTE';
  let levelColor = '#00FF88';
  let levelBadgeStyle = 'bg-[#00FF88]/15 border-[#00FF88]/40 text-[#00FF88]';

  if (totalScore < 500) {
    level = 'CRITICO';
    levelColor = '#FF4D6D';
    levelBadgeStyle = 'bg-[#FF4D6D]/15 border-[#FF4D6D]/40 text-[#FF4D6D]';
  } else if (totalScore < 700) {
    level = 'ATENCAO';
    levelColor = '#F59E0B';
    levelBadgeStyle = 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]';
  } else if (totalScore < 850) {
    level = 'BOM';
    levelColor = '#06B6D4';
    levelBadgeStyle = 'bg-[#06B6D4]/15 border-[#06B6D4]/40 text-[#06B6D4]';
  }

  // Recomendações automáticas baseadas nos pontos fracos
  const recommendations: string[] = [];
  if (reserveScore < 200) {
    recommendations.push('Aumente a sua reserva de emergência para cobrir pelo menos 6 meses de custo fixo.');
  }
  if (debtScore < 200) {
    recommendations.push('Considere antecipar parcelas de contratos para reduzir a incidência de juros bancários.');
  }
  if (savingsScore < 150) {
    recommendations.push('Sua taxa de poupança está abaixo de 20%. Tente limitar despesas discricionárias.');
  }
  if (walletScore < 130) {
    recommendations.push('Cadastre e organize mais carteiras ou cartões para otimizar sua distribuição de liquidez.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Parabéns! Sua gestão financeira está no padrão de excelência.');
  }

  return {
    score: totalScore,
    level,
    levelColor,
    levelBadgeStyle,
    breakdown: {
      reserveScore,
      debtScore,
      savingsScore,
      walletScore,
    },
    recommendations,
  };
}
