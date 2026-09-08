export interface ExtractedDeduction {
  id: string;
  name: string;
  amount: number;
  category: string;
}

export interface ParsedContrachequeData {
  employer: string;
  referenceMonth: string; // Formato YYYY-MM
  grossSalary: number;
  netSalary: number;
  deductions: ExtractedDeduction[];
  totalDeductions: number;
  bankName?: string;
  consignableMargin?: number;
}

const MONTH_NAME_MAP: Record<string, string> = {
  jan: '01',
  fev: '02',
  mar: '03',
  abr: '04',
  mai: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  set: '09',
  out: '10',
  nov: '11',
  dez: '12',
};

/**
 * Extrai o último valor monetário no formato brasileiro ou numérico de uma linha.
 */
export function extractLastCurrencyValue(line: string): number | null {
  const matches = line.match(/(?:\d{1,3}(?:\.\d{3})+|\d+)[.,]\d{2}/g);
  if (!matches || matches.length === 0) return null;
  const lastMatch = matches[matches.length - 1];
  const normalized = lastMatch.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(normalized);
  return isNaN(val) ? null : val;
}

/**
 * Detecta a competência / mês de referência no texto com alta precisão.
 * Prioriza rótulos explícitos de "COMPETÊNCIA", siglas mensais e colunas de competência.
 * Evita capturar datas de admissão (ex: 26/01/2022).
 */
export function extractReferenceMonth(text: string): string {
  // 1. Rótulo explícito "COMPETÊNCIA" ou "MÊS/ANO" seguido por Mês/Ano (mesmo com quebra de linha)
  // Ex: "COMPETÊNCIA\nAGO/2026", "COMPETÊNCIA: 08/2026", "COMPETÊNCIA AGO/26"
  const explicitMatch = text.match(
    /(?:compet[eê]ncia|m[eê]s\/ano|folha\s+mensal|demonstrativo[^\n\r]*?)\s*[:\-\s\n\r]*([A-Za-z]{3}|0[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})\b/i
  );
  if (explicitMatch) {
    const rawMonth = explicitMatch[1].toLowerCase();
    const month = MONTH_NAME_MAP[rawMonth.slice(0, 3)] || rawMonth.padStart(2, '0');
    let year = explicitMatch[2];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}`;
  }

  // 2. Formato textual direto de mês e ano: AGO/2026, AGOSTO DE 2026, FEV/2026, OUT/2025
  const monthNameRegex = /\b(jan(?:eiro)?|fev(?:ereiro)?|mar(?:[cç]o)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\s*(?:[\/\-]|de\s+)(20\d{2}|\d{2})\b/i;
  const textMonthMatch = text.match(monthNameRegex);
  if (textMonthMatch) {
    const rawMonthStr = textMonthMatch[1].toLowerCase().slice(0, 3);
    const monthNumber = MONTH_NAME_MAP[rawMonthStr] || '01';
    let year = textMonthMatch[2];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${monthNumber}`;
  }

  // 3. Coluna de competência em tabelas de rubricas (ex: "08/26" ou "02/2026" com palavra COMPET antes)
  const tableCompetMatch = text.match(/compet[^\n\r]*?\b(0[1-9]|1[0-2])\/(20\d{2}|\d{2})\b/i);
  if (tableCompetMatch) {
    const month = tableCompetMatch[1].padStart(2, '0');
    let year = tableCompetMatch[2];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}`;
  }

  // 4. Formato MM/YYYY que NÃO seja precedido por dia (evita capturar datas completas como 26/01/2022)
  const safeDateMatch = text.match(/(?<!\d\/|\d)(0[1-9]|1[0-2])[\/\-](20\d{2})\b/);
  if (safeDateMatch) {
    return `${safeDateMatch[2]}-${safeDateMatch[1].padStart(2, '0')}`;
  }

  // Fallback: Mês e ano atual
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${currentMonth}`;
}

/**
 * Categoriza o desconto baseado no nome da rubrica.
 */
export function categorizeDeduction(name: string): string {
  const upper = name.toUpperCase();

  // Impostos e Previdência Pública
  if (
    upper.includes('IRRF') ||
    upper.includes('IMPOSTO DE RENDA') ||
    upper.includes('PROTEÇÃO SOCIAL') ||
    upper.includes('PROTECAO SOCIAL') ||
    upper.includes('INSS') ||
    upper.includes('PREVIDÊNCIA') ||
    upper.includes('PREVIDENCIA') ||
    upper.includes('FUNFIN') ||
    upper.includes('IPSEP') ||
    upper.includes('FGTS')
  ) {
    return 'Impostos & Taxas';
  }

  // Empréstimos e Financiamentos Consignados
  if (
    upper.includes('CONSIG') ||
    upper.includes('EMPRÉSTIMO') ||
    upper.includes('EMPRESTIMO') ||
    upper.includes('BRADESCO') ||
    upper.includes('SANTANDER') ||
    upper.includes('ITAÚ') ||
    upper.includes('ITAU') ||
    upper.includes('BANCO DO BRASIL') ||
    upper.includes('BB ') ||
    upper.includes('CAIXA') ||
    upper.includes('FINANC')
  ) {
    return 'Financiamentos & Empréstimos';
  }

  // Assistência Médica / Odontológica / Hospitalar
  if (
    upper.includes('SISMEPE') ||
    upper.includes('SAÚDE') ||
    upper.includes('SAUDE') ||
    upper.includes('UNIMED') ||
    upper.includes('HAPVIDA') ||
    upper.includes('ODONTO') ||
    upper.includes('DENTAL') ||
    upper.includes('HOSPITAL') ||
    upper.includes('MÉDIC') ||
    upper.includes('MEDIC')
  ) {
    return 'Saúde';
  }

  // Pensão Alimentícia
  if (upper.includes('PENSÃO') || upper.includes('PENSAO') || upper.includes('ALIMENT')) {
    return 'Família & Filhos';
  }

  return 'Outras Despesas';
}

/**
 * Detecta a empresa ou órgão pagador.
 */
export function extractEmployer(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('policia militar') || lower.includes('polícia militar') || lower.includes('pmpe')) {
    return 'Polícia Militar de Pernambuco (PMPE)';
  }
  if (lower.includes('governo do estado de pernambuco')) {
    return 'Governo do Estado de Pernambuco';
  }
  if (lower.includes('corpo de bombeiros') || lower.includes('cbmpe')) {
    return 'Corpo de Bombeiros Militar (CBMPE)';
  }
  if (lower.includes('tribunal de justi') || lower.includes('tjpe')) {
    return 'Tribunal de Justiça de Pernambuco (TJPE)';
  }
  if (lower.includes('prefeitura')) {
    const prefMatch = text.match(/prefeitura\s+(?:municipal\s+de\s+)?([^\n\r]+)/i);
    if (prefMatch) return `Prefeitura de ${prefMatch[1].trim()}`;
    return 'Prefeitura Municipal';
  }

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3);
  for (const line of lines.slice(0, 4)) {
    if (
      !line.toLowerCase().includes('demonstrativo') &&
      !line.toLowerCase().includes('comprovante') &&
      !line.toLowerCase().includes('página') &&
      !line.toLowerCase().includes('pagina')
    ) {
      return line.slice(0, 50);
    }
  }

  return 'Empregador / Folha de Pagamento';
}

/**
 * Processa o texto completo extraído do contracheque e retorna dados estruturados.
 */
export function parseContrachequeText(text: string): ParsedContrachequeData {
  const employer = extractEmployer(text);
  const referenceMonth = extractReferenceMonth(text);

  let grossSalary = 0;
  let netSalary = 0;
  let consignableMargin: number | undefined = undefined;
  let bankName: string | undefined = undefined;
  const foundDeductions: ExtractedDeduction[] = [];

  // Extração de Margem Consignável
  const marginMatch = text.match(/MARGEM\s+CONSIG[^\n\r]*?R\$\s*([\d\.,]+)/i);
  if (marginMatch) {
    const parsedMargin = parseFloat(marginMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(parsedMargin)) consignableMargin = parsedMargin;
  }

  // Extração de Banco / Agência
  const bankMatch = text.match(/BANCO\/AG[ÊE]NCIA\s*[\n\r]+\s*([^\n\r]+)/i);
  if (bankMatch) {
    bankName = bankMatch[1].trim();
  }

  // Extração direta do bloco de resumo VANTAGENS / DESCONTOS / LÍQUIDO se disponível
  const vantagensSummaryMatch = text.match(/VANTAGENS\s*[\n\r]+\s*R\$\s*([\d\.,]+)/i);
  if (vantagensSummaryMatch) {
    const val = parseFloat(vantagensSummaryMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val) && val > 0) grossSalary = val;
  }

  const liquidoSummaryMatch = text.match(/L[ÍI]QUIDO\s*[\n\r]+\s*R\$\s*([\d\.,]+)/i);
  if (liquidoSummaryMatch) {
    const val = parseFloat(liquidoSummaryMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val) && val > 0) netSalary = val;
  }

  const lines = text.split('\n');
  let inDeductionSection = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();
    const val = extractLastCurrencyValue(line);

    // Identificação de seções
    if (lower.includes('rubrica/complemento')) {
      inDeductionSection = false;
      continue;
    }
    if (
      lower.includes('descontos e deduções') ||
      lower.includes('descontos:') ||
      lower.includes('deduções:')
    ) {
      inDeductionSection = true;
    }
    if (
      lower.includes('rendimentos / vantagens') ||
      lower.includes('rendimentos:') ||
      lower.includes('vantagens:') ||
      lower.includes('proventos:')
    ) {
      inDeductionSection = false;
    }

    // Fallbacks para Salário Bruto se não pegou no resumo acima
    if (grossSalary === 0) {
      if (
        lower.includes('total de vencimentos') ||
        lower.includes('total de rendimentos') ||
        lower.includes('total de proventos') ||
        lower.includes('total bruto') ||
        lower.includes('vencimentos bruto')
      ) {
        if (val !== null && val > 0) grossSalary = val;
      }
    }

    // Fallbacks para Salário Líquido se não pegou no resumo acima
    if (netSalary === 0) {
      if (
        lower.includes('líquido a receber') ||
        lower.includes('liquido a receber') ||
        lower.includes('total líquido') ||
        lower.includes('valor líquido')
      ) {
        if (val !== null && val > 0) netSalary = val;
      }
    }

    // Detecção estruturada de rubricas da PMPE / militar: "4003 - FUND PROTECAO..."
    const codeMatch = line.match(/^(\d{1,5})\s*[\-:]?\s*([A-Za-zÀ-ÖØ-öø-ÿ0-9\.\-\/\(\)\s]+?)(?:\s+[\d\.,]+)?\s+(?:R\$\s*)?([\d\.,]+)$/);
    if (codeMatch && val !== null) {
      const code = codeMatch[1];
      let desc = codeMatch[2].trim();
      const codeNum = parseInt(code, 10);

      // Rubricas com código menor que 4000 na folha PMPE são Proventos/Vantagens (ex: 3 Soldo, 81 Remun, 201 Férias, 502 Vale Refeição)
      const isKnownAdvantageCode = codeNum < 4000;

      // Rubricas a partir de 4000 são Descontos (ex: 4003, 4061, 4302, 4506, 5091)
      const isKnownDeductionCode =
        code === '4003' ||
        code === '4061' ||
        code === '4302' ||
        code === '4506' ||
        code === '5091' ||
        code.startsWith('4') ||
        code.startsWith('5') ||
        codeNum >= 4000;

      if (!isKnownAdvantageCode && (inDeductionSection || isKnownDeductionCode)) {
        // Verifica se a próxima linha é COMPLEMENTO para enriquecer a descrição
        const nextLine = (lines[idx + 1] || '').trim();
        if (nextLine.startsWith('COMPLEMENTO:')) {
          const compVal = nextLine.replace('COMPLEMENTO:', '').trim();
          if (compVal && compVal.toLowerCase() !== 'normal') {
            desc = `${desc} (${compVal})`;
          }
        }

        // Evita duplicatas se a mesma rubrica aparecer repetida no OCR
        if (!foundDeductions.some((d) => d.id === `ded_${code}`)) {
          foundDeductions.push({
            id: `ded_${code}`,
            name: `${code} - ${desc}`,
            amount: val,
            category: categorizeDeduction(desc),
          });
          continue;
        }
      }
    }

    // Detecção por palavras-chave se não casou no regex acima
    if (val !== null && val > 0) {
      if (lower.includes('4003') || lower.includes('protecao social') || lower.includes('proteção social')) {
        if (!foundDeductions.some((d) => d.name.includes('4003') || d.name.includes('Proteção Social'))) {
          foundDeductions.push({ id: `ded_4003`, name: '4003 - Fund. Proteção Social Militar', amount: val, category: 'Impostos & Taxas' });
        }
      } else if (lower.includes('4061') || lower.includes('imposto de rend') || lower.includes('irrf')) {
        if (!foundDeductions.some((d) => d.name.includes('4061') || d.name.includes('IRRF'))) {
          foundDeductions.push({ id: `ded_4061`, name: '4061 - Desconto de Imposto de Renda (IRRF)', amount: val, category: 'Impostos & Taxas' });
        }
      } else if (lower.includes('4302') || lower.includes('remum ferias')) {
        if (!foundDeductions.some((d) => d.name.includes('4302'))) {
          foundDeductions.push({ id: `ded_4302`, name: '4302 - Compens. Ad. 1/3 Férias', amount: val, category: 'Outras Despesas' });
        }
      } else if (lower.includes('4506') || (lower.includes('bradesco') && lower.includes('consig'))) {
        if (!foundDeductions.some((d) => d.name.includes('4506') || d.name.includes('Bradesco'))) {
          foundDeductions.push({ id: `ded_4506`, name: '4506 - Bradesco S/A (Empréstimo Consignado 01)', amount: val, category: 'Financiamentos & Empréstimos' });
        }
      } else if (lower.includes('5091') || lower.includes('sismepe')) {
        if (!foundDeductions.some((d) => d.name.includes('5091') || d.name.includes('SISMEPE'))) {
          foundDeductions.push({ id: `ded_5091`, name: '5091 - SISMEPE (Contribuição Mensal Saúde)', amount: val, category: 'Saúde' });
        }
      }
    }
  }

  const totalDeductions = foundDeductions.reduce((sum, d) => sum + d.amount, 0);

  // Se tiver bruto e deduções mas não tiver líquido explicito: Líquido = Bruto - Descontos
  if (grossSalary > 0 && netSalary === 0 && totalDeductions > 0) {
    netSalary = Math.max(0, grossSalary - totalDeductions);
  }

  // Se tiver líquido e deduções mas não tiver bruto: Bruto = Líquido + Descontos
  if (netSalary > 0 && grossSalary === 0 && totalDeductions > 0) {
    grossSalary = netSalary + totalDeductions;
  }

  return {
    employer,
    referenceMonth,
    grossSalary,
    netSalary,
    deductions: foundDeductions,
    totalDeductions,
    bankName,
    consignableMargin,
  };
}
