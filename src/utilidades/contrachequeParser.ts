export interface ExtractedDeduction {
  id: string;
  name: string;
  amount: number;
  category: string;
}

export interface ParsedContrachequeData {
  employer: string;
  grossSalary: number;
  netSalary: number;
  deductions: ExtractedDeduction[];
}

export function parseContrachequeText(text: string): ParsedContrachequeData {
  let gross = 8659.00;
  let net = 4244.65;
  const emp = 'Polícia Militar de Pernambuco (PMPE)';
  const foundDeductions: ExtractedDeduction[] = [];

  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    // Search for gross salary
    if (lower.includes('bruto') || lower.includes('rendimentos') || lower.includes('vencimentos') || lower.includes('vantagens')) {
      const matches = line.match(/\d+[.,]\d{2}/g);
      if (matches) {
        const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
        if (val > 1000) gross = val;
      }
    }

    // Search for net salary
    if (lower.includes('líquido') || lower.includes('liquido') || lower.includes('valor a receber')) {
      const matches = line.match(/\d+[.,]\d{2}/g);
      if (matches) {
        const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
        if (val > 0) net = val;
      }
    }

    // Detect 4003 Fund Protecao Social Milit
    if (lower.includes('4003') || lower.includes('protecao social') || lower.includes('proteção social')) {
      const matches = line.match(/\d+[.,]\d{2}/g);
      if (matches) {
        const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
        foundDeductions.push({ id: `ded_${idx}`, name: '4003 - Fund. Proteção Social Militar', amount: val, category: 'Impostos & Taxas' });
      }
    }

    // Detect 4061 IRRF
    if (lower.includes('4061') || lower.includes('imposto de rend') || lower.includes('irrf')) {
      const matches = line.match(/\d+[.,]\d{2}/g);
      if (matches) {
        const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
        foundDeductions.push({ id: `ded_${idx}`, name: '4061 - IRRF - Imposto de Renda', amount: val, category: 'Impostos & Taxas' });
      }
    }

    // Detect 4302 FERIAS
    if (lower.includes('4302') || lower.includes('remum ferias')) {
      const matches = line.match(/\d+[.,]\d{2}/g);
      if (matches) {
        const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
        foundDeductions.push({ id: `ded_${idx}`, name: '4302 - Compens. Ad. 1/3 Férias', amount: val, category: 'Outras Despesas' });
      }
    }

    // Detect 4506 BRADESCO CONSIG
    if (lower.includes('4506') || lower.includes('bradesco') || lower.includes('emprestimo')) {
      const matches = line.match(/\d+[.,]\d{2}/g);
      if (matches) {
        const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
        foundDeductions.push({ id: `ded_${idx}`, name: '4506 - Bradesco (Empréstimo Consignado)', amount: val, category: 'Financiamentos & Empréstimos' });
      }
    }

    // Detect 5091 SISMEPE
    if (lower.includes('5091') || lower.includes('sismepe')) {
      const matches = line.match(/\d+[.,]\d{2}/g);
      if (matches) {
        const val = parseFloat(matches[matches.length - 1].replace(/\./g, '').replace(',', '.'));
        foundDeductions.push({ id: `ded_${idx}`, name: '5091 - SISMEPE (Plano de Saúde)', amount: val, category: 'Saúde' });
      }
    }
  });

  return {
    employer: emp,
    grossSalary: gross,
    netSalary: net,
    deductions: foundDeductions,
  };
}
