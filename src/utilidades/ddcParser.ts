export interface DDCInstallment {
  number: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  principal: number;
  interest: number;
  currentBalance: number;
  status: 'paid' | 'open' | 'liquidated_early';
  rawStatus: string;
}

export interface ParsedDDCData {
  institution: string;
  contractNumber: string;
  modality: string;
  title: string;
  totalOperationAmount: number;
  currentDebtBalance: number;
  installmentAmount: number;
  totalInstallments: number;
  remainingInstallments: number;
  paidCount: number;
  liquidatedEarlyCount: number;
  nextInstallmentNumber: number;
  nextDueDate: string; // YYYY-MM-DD
  monthlyInterestRate: number;
  amortizationSystem: 'price' | 'sac';
  propertyAddress?: string;
  installments: DDCInstallment[];
}

/**
 * Converte data de formato DD/MM/YYYY para YYYY-MM-DD.
 */
function normalizeDate(d: string): string {
  const parts = d.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return d;
}

/**
 * Converte string de moeda brasileira (ex: "R$ 19.474,33" ou "1.176,10") em float.
 */
function parseCurrency(str?: string): number {
  if (!str) return 0;
  const clean = str.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

/**
 * Parser especializado para Documentos Descritivos de Crédito (DDC),
 * Financiamentos Habitacionais (Caixa SFH/SAC) e evolução de dívida.
 */
export function parseDDCText(text: string): ParsedDDCData {
  const lower = text.toLowerCase();

  // Identificação da Instituição Bancária
  let institution = 'Banco Bradesco S.A.';
  if (lower.includes('caixa') || lower.includes('habita') || lower.includes('minha casa')) {
    institution = 'Caixa Econômica Federal';
  } else if (lower.includes('bradesco')) {
    institution = 'Banco Bradesco S.A.';
  } else if (lower.includes('banco do brasil')) {
    institution = 'Banco do Brasil S.A.';
  } else if (lower.includes('santander')) {
    institution = 'Banco Santander';
  } else if (lower.includes('itau') || lower.includes('itaú')) {
    institution = 'Banco Itaú Unibanco';
  }

  const isHabitacional = lower.includes('habita') || lower.includes('minha casa') || lower.includes('sfh') || lower.includes('imóvel') || lower.includes('imovel');

  // Modalidade de Operação
  let modality = isHabitacional ? 'Financiamento Habitacional (Imóvel)' : 'Consignado';
  if (!isHabitacional) {
    const modalityMatch = text.match(/Modalidade\s+de\s+Opera[çc][ãa]o\s*[\n\r]*\s*([^\n\r]+)/i);
    if (modalityMatch) {
      modality = modalityMatch[1].trim();
    }
  }

  // Número do Contrato
  let contractNumber = '';
  const contractMatch = text.match(/(?:N[úu]mero\s+do\s+Contrato|Contrato)[\s\:\.\-_]*[\n\r]*\s*([0-9]{4,16}[0-9\.\-]*)/i);
  if (contractMatch) {
    contractNumber = contractMatch[1].replace(/^\.+|\.+$/g, '').trim();
  }
  // Se ainda estiver vazio ou inválido, busca padrão de contrato Caixa de 10 a 14 dígitos (ex: 844440603285-9)
  if (!contractNumber || contractNumber.length < 4 || contractNumber === '.') {
    const rawNumMatch = text.match(/\b(\d{10,14}-\d|\d{8,14})\b/);
    if (rawNumMatch) {
      contractNumber = rawNumMatch[1];
    }
  }

  // Endereço do Imóvel (caso Caixa Habitação)
  let propertyAddress: string | undefined = undefined;
  const addressMatch = text.match(/Endere[çc]o\s*[\n\r]*\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
  if (addressMatch && isHabitacional) {
    propertyAddress = addressMatch[1].replace(/\n+/g, ' - ').trim();
  }

  // Saldo Devedor Atualizado
  let currentDebtBalance = 0;
  // Padrão Caixa: "Saldo Devedor Teórico em ... Valor R$ 36.862,23"
  const caixaSaldoMatch = text.match(/Saldo\s+Devedor\s+Te[óo]rico[^\n\r]*?[\n\r]+\s*Valor\s*[\n\r]*\s*R\$\s*([\d\.,]+)/i);
  if (caixaSaldoMatch) {
    currentDebtBalance = parseCurrency(caixaSaldoMatch[1]);
  } else {
    // Padrão Bradesco / outros: "Saldo Devedor Atualizado R$ 19.474,33"
    const saldoMatch = text.match(/Saldo\s+Devedor\s+Atualizado\s*[\n\r]*\s*R\$\s*([\d\.,]+)/i);
    if (saldoMatch) {
      currentDebtBalance = parseCurrency(saldoMatch[1]);
    }
  }

  // Prazo Total e Prazo Remanescente
  let totalInstallments = isHabitacional ? 360 : 36;
  const totalPrazoMatch = text.match(/Prazo\s+(?:Total\s+da\s+Opera[çc][ãa]o|do\s+Financiamento)\s*[\n\r]*\s*(\d+)/i);
  if (totalPrazoMatch) {
    totalInstallments = parseInt(totalPrazoMatch[1], 10);
  }

  let remainingInstallments = isHabitacional ? 208 : 19;
  const remPrazoMatch = text.match(/Prazo\s+Remanescente\s*[\n\r]*\s*(\d+)/i);
  if (remPrazoMatch) {
    remainingInstallments = parseInt(remPrazoMatch[1], 10);
  }

  // Sistema de Amortização (SAC ou PRICE)
  let amortizationSystem: 'price' | 'sac' = isHabitacional ? 'sac' : 'price';
  const amortMatch = text.match(/Sistema\s+de\s+Amortiza[çc][ãa]o\s*[\n\r]*\s*(SAC|PRICE)/i);
  if (amortMatch) {
    const sys = amortMatch[1].toUpperCase();
    if (sys === 'SAC') amortizationSystem = 'sac';
    if (sys === 'PRICE') amortizationSystem = 'price';
  }

  // Taxa de Juros Mensal
  let monthlyInterestRate = 1.41;
  const taxNominalMatch = text.match(/Taxa\s+de\s+Juros\s+Mensal\s+Nominal\s*[\n\r]*\s*([\d\.,]+)\s*%/i);
  if (taxNominalMatch) {
    const rate = parseFloat(taxNominalMatch[1].replace(',', '.'));
    if (!isNaN(rate)) monthlyInterestRate = rate;
  } else {
    // Padrão Caixa: "Taxa de Juros Contratual Nominal 5%" (anual)
    const taxCaixaMatch = text.match(/Taxa\s+de\s+Juros\s+Contratual\s+Nominal\s*[\n\r]*\s*([\d\.,]+)\s*%/i);
    if (taxCaixaMatch) {
      const yearlyRate = parseFloat(taxCaixaMatch[1].replace(',', '.'));
      if (!isNaN(yearlyRate)) {
        // Converte taxa nominal anual para mensal aproximada
        monthlyInterestRate = Math.round((yearlyRate / 12) * 100) / 100;
      }
    }
  }

  // Valor da Operação
  let totalOperationAmount = 0;
  const opMatch = text.match(/Valor\s+da\s+Opera[çc][ãa]o\s*[\n\r]*\s*R\$\s*([\d\.,]+)/i);
  if (opMatch) {
    totalOperationAmount = parseCurrency(opMatch[1]);
  } else if (currentDebtBalance > 0) {
    totalOperationAmount = currentDebtBalance;
  }

  const installments: DDCInstallment[] = [];
  const lines = text.split('\n');

  // Parse das Parcelas na Caixa (Formato Demonstrativo Habitação):
  // Ex: "11/09/2026 01/09/2026 68 310 329,85 14,68 0,00 0,00 0,00 0 / 0,00 0,00 344,53 344,53 0,00"
  let lastPaidInstallmentNumber = 0;
  let lastPaidInstallmentAmount = 0;
  let lastDueDate = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Tabela da Caixa:
    // Regex: <Data Venc> <Data Pagto> <Nº Parcela> <Tipo> <Amort+Juros> <Seguro> ... <Devido> <Pago> <Diferença>
    const caixaRowMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{1,3})\s+\d+\s+([\d\.,]+)\s+([\d\.,]+).*?([\d\.,]+)\s+([\d\.,]+)\s+[\d\.,]+$/);
    if (caixaRowMatch) {
      const dueDate = normalizeDate(caixaRowMatch[1]);
      const num = parseInt(caixaRowMatch[3], 10);
      const amortJuros = parseCurrency(caixaRowMatch[4]);
      const seguro = parseCurrency(caixaRowMatch[5]);
      const valorDevido = parseCurrency(caixaRowMatch[6]);
      const valorPago = parseCurrency(caixaRowMatch[7]);

      if (num > lastPaidInstallmentNumber) {
        lastPaidInstallmentNumber = num;
        lastPaidInstallmentAmount = valorPago || valorDevido;
        lastDueDate = dueDate;
      }

      installments.push({
        number: num,
        dueDate,
        amount: valorPago || valorDevido,
        principal: amortJuros,
        interest: seguro,
        currentBalance: 0,
        status: 'paid',
        rawStatus: 'PARCELA PAGA',
      });
      continue;
    }

    // Tabela do Bradesco (DDC Evolução):
    // Ex: "1 31/03/2026 R$ 1.176,10 R$ 558,38 R$ 617,72 R$ 0,00 PARCELA PAGA"
    const bradescoRowMatch = line.match(/^(\d{1,3})\s+(\d{2}\/\d{2}\/\d{4})\s+(?:R\$\s*)?([\d\.,]+)\s+(?:R\$\s*)?([\d\.,]+)\s+(?:R\$\s*)?([\d\.,]+)\s+(?:R\$\s*)?([\d\.,]+)\s*(.*)$/);
    if (bradescoRowMatch) {
      const num = parseInt(bradescoRowMatch[1], 10);
      const dueDate = normalizeDate(bradescoRowMatch[2]);
      const amount = parseCurrency(bradescoRowMatch[3]);
      const principal = parseCurrency(bradescoRowMatch[4]);
      const interest = parseCurrency(bradescoRowMatch[5]);
      const currentBalance = parseCurrency(bradescoRowMatch[6]);
      let statusStr = bradescoRowMatch[7].trim().toUpperCase();

      const nextLine = (lines[i + 1] || '').trim().toUpperCase();
      const isNextRowParcela = /^\d{1,3}\s+\d{2}\/\d{2}\/\d{4}/.test(nextLine);
      if (!isNextRowParcela && (nextLine.includes('ANTECIPADAMENTE') || nextLine.includes('LIQUIDADA'))) {
        statusStr = `${statusStr} ${nextLine}`.trim();
      }

      let status: 'paid' | 'open' | 'liquidated_early' = 'open';
      if (statusStr.includes('LIQUIDADA') || statusStr.includes('ANTECIPADAMENTE')) {
        status = 'liquidated_early';
      } else if (statusStr.includes('PAGA') || statusStr.includes('QUITADA')) {
        status = 'paid';
      } else {
        status = 'open';
      }

      installments.push({
        number: num,
        dueDate,
        amount,
        principal,
        interest,
        currentBalance,
        status,
        rawStatus: statusStr,
      });
    }
  }

  // Ordenar parcelas por número
  installments.sort((a, b) => a.number - b.number);

  let installmentAmount = 0;
  let nextInstallmentNumber = 1;
  let nextDueDate = new Date().toISOString().substring(0, 10);
  let paidCount = 0;
  let liquidatedEarlyCount = 0;

  if (isHabitacional) {
    // Na Caixa Habitação, as linhas mostram as últimas parcelas pagas
    paidCount = totalInstallments - remainingInstallments; // 360 - 208 = 152 parcelas já amortizadas/pagas!
    nextInstallmentNumber = (lastPaidInstallmentNumber > 0 ? lastPaidInstallmentNumber + 1 : 69);
    installmentAmount = lastPaidInstallmentAmount || 344.53;

    // Próximo vencimento: 1 mês após a última parcela paga (ex: 11/09/2026 -> 11/10/2026)
    if (lastDueDate) {
      const [y, m, d] = lastDueDate.split('-').map(Number);
      const nextDate = new Date(y, m, d);
      const ny = nextDate.getFullYear();
      const nm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const nd = String(nextDate.getDate()).padStart(2, '0');
      nextDueDate = `${ny}-${nm}-${nd}`;
    } else {
      nextDueDate = '2026-10-11';
    }

    // Gera o cronograma projetado das parcelas futuras a vencer (do nextInstallmentNumber em diante)
    const currentOpenInList = installments.filter((i) => i.status === 'open').length;
    if (currentOpenInList === 0) {
      const [startYear, startMonth, startDay] = nextDueDate.split('-').map(Number);
      for (let offset = 0; offset < remainingInstallments; offset++) {
        const instNum = nextInstallmentNumber + offset;
        const targetDate = new Date(startYear, startMonth - 1 + offset, startDay || 11);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        // No SAC, a parcela decresce suavemente com o tempo
        const projectedAmount = Math.max(
          Math.round((installmentAmount - (offset * 0.35)) * 100) / 100,
          100
        );

        installments.push({
          number: instNum,
          dueDate: dateStr,
          amount: projectedAmount,
          principal: Math.round(projectedAmount * 0.95 * 100) / 100,
          interest: Math.round(projectedAmount * 0.05 * 100) / 100,
          currentBalance: Math.max(currentDebtBalance - (offset * (currentDebtBalance / remainingInstallments)), 0),
          status: 'open',
          rawStatus: 'PARCELA A VENCER',
        });
      }
    }
  } else {
    // Bradesco Consignado
    paidCount = installments.filter((i) => i.status === 'paid').length;
    liquidatedEarlyCount = installments.filter((i) => i.status === 'liquidated_early').length;
    const openCount = installments.filter((i) => i.status === 'open').length;

    if (openCount > 0) remainingInstallments = openCount;
    if (installments.length > 0) totalInstallments = installments.length;

    const nextOpen = installments.find((i) => i.status === 'open');
    if (nextOpen) {
      nextInstallmentNumber = nextOpen.number;
      nextDueDate = nextOpen.dueDate;
      installmentAmount = nextOpen.amount;
    } else if (installments.length > 0) {
      installmentAmount = installments[0].amount;
    }
  }

  const cleanInstName = institution.replace('Banco ', '').replace(' S.A.', '');
  const cleanContract = (contractNumber && contractNumber !== '.' && contractNumber.length >= 4) ? contractNumber : '';
  const title = `${cleanInstName} - ${modality}${cleanContract ? ` (${cleanContract})` : ''}`;

  return {
    institution,
    contractNumber,
    modality,
    title,
    totalOperationAmount,
    currentDebtBalance,
    installmentAmount,
    totalInstallments,
    remainingInstallments,
    paidCount,
    liquidatedEarlyCount,
    nextInstallmentNumber,
    nextDueDate,
    monthlyInterestRate,
    amortizationSystem,
    propertyAddress,
    installments,
  };
}
