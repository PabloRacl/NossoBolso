import { describe, it, expect } from 'vitest';
import { parseContrachequeText, extractReferenceMonth } from '../contrachequeParser';

describe('contrachequeParser - Parser de Contracheque e Folha de Pagamento', () => {
  it('deve extrair salário bruto, líquido, competência 02/2026 e deduções de um contracheque PMPE', () => {
    const rawContrachequeText = `
GOVERNO DO ESTADO DE PERNAMBUCO
POLICIA MILITAR DE PERNAMBUCO
DEMONSTRATIVO DE PAGAMENTO MENSAL - 02/2026

RENDIMENTOS / VANTAGENS:
0001 SOLDO BASE                    4.200,00
0025 GRATIF. EXERCÍCIO             3.150,00
0030 ADICIONAL MILITAR             1.309,00
TOTAL DE VENCIMENTOS BRUTO:        8.659,00

DESCONTOS E DEDUÇÕES:
4003 FUND. PROTEÇÃO SOCIAL MILIT     822,60
4061 IMPOSTO DE RENDA RETIDO IRRF  1.120,40
4302 REMUM FERIAS - COMPENS. ADIC    345,10
4506 BRADESCO EMPRESTIMO CONSIG    1.480,25
5091 SISMEPE ASSIST. SAÚDE           646,00

TOTAL DE DESCONTOS:                4.414,35
LÍQUIDO A RECEBER:                 4.244,65
    `;

    const parsed = parseContrachequeText(rawContrachequeText);

    expect(parsed.referenceMonth).toBe('2026-02');
    expect(parsed.grossSalary).toBeCloseTo(8659.00, 2);
    expect(parsed.netSalary).toBeCloseTo(4244.65, 2);
    expect(parsed.employer).toBe('Polícia Militar de Pernambuco (PMPE)');
    expect(parsed.deductions.length).toBe(5);

    // Conferir cada dedução e sua respectiva categoria atribuída
    const ded4003 = parsed.deductions.find((d) => d.name.includes('4003'));
    expect(ded4003).toBeDefined();
    expect(ded4003?.amount).toBeCloseTo(822.60, 2);
    expect(ded4003?.category).toBe('Impostos & Taxas');

    const ded4061 = parsed.deductions.find((d) => d.name.includes('4061'));
    expect(ded4061).toBeDefined();
    expect(ded4061?.amount).toBeCloseTo(1120.40, 2);
    expect(ded4061?.category).toBe('Impostos & Taxas');

    const ded4302 = parsed.deductions.find((d) => d.name.includes('4302'));
    expect(ded4302).toBeDefined();
    expect(ded4302?.amount).toBeCloseTo(345.10, 2);
    expect(ded4302?.category).toBe('Outras Despesas');

    const ded4506 = parsed.deductions.find((d) => d.name.includes('4506'));
    expect(ded4506).toBeDefined();
    expect(ded4506?.amount).toBeCloseTo(1480.25, 2);
    expect(ded4506?.category).toBe('Financiamentos & Empréstimos');

    const ded5091 = parsed.deductions.find((d) => d.name.includes('5091'));
    expect(ded5091).toBeDefined();
    expect(ded5091?.amount).toBeCloseTo(646.00, 2);
    expect(ded5091?.category).toBe('Saúde');
  });

  it('deve extrair corretamente dados de um mês diferente (ex: Outubro/2025 com dados alterados)', () => {
    const octoberText = `
GOVERNO DO ESTADO DE PERNAMBUCO
POLÍCIA MILITAR DE PERNAMBUCO
COMPETÊNCIA: 10/2025

TOTAL DE VENCIMENTOS: 9.150,00
DESCONTOS E DEDUÇÕES:
4003 PROTEÇÃO SOCIAL 960,75
4061 IRRF 1.250,00
4506 BRADESCO CONSIG 1.176,10
5091 SISMEPE SAUDE 61,93

VALOR LÍQUIDO: 5.701,22
    `;

    const parsed = parseContrachequeText(octoberText);

    expect(parsed.referenceMonth).toBe('2025-10');
    expect(parsed.grossSalary).toBeCloseTo(9150.00, 2);
    expect(parsed.netSalary).toBeCloseTo(5701.22, 2);
    expect(parsed.deductions.length).toBe(4);
  });

  it('deve extrair competência por extenso ou formato Mês/Ano (ex: AGO/2026)', () => {
    const textWithMonthName = `
FOLHA MENSAL - AGO/2026
EMPRESA TECH BRASIL LTDA
Total Bruto: 12.500,00
Líquido a Receber: 9.200,00
    `;

    const parsed = parseContrachequeText(textWithMonthName);
    expect(parsed.referenceMonth).toBe('2026-08');
    expect(parsed.grossSalary).toBeCloseTo(12500.00, 2);
    expect(parsed.netSalary).toBeCloseTo(9200.00, 2);
  });

  it('deve calcular salário líquido quando apenas bruto e deduções forem informados', () => {
    const textWithoutNet = `
MÊS/ANO: 03/2026
Total de Vencimentos: 10.000,00
DESCONTOS:
4003 Previdência: 1.000,00
4061 Imposto de Renda: 1.500,00
    `;

    const parsed = parseContrachequeText(textWithoutNet);
    expect(parsed.referenceMonth).toBe('2026-03');
    expect(parsed.grossSalary).toBeCloseTo(10000.00, 2);
    expect(parsed.netSalary).toBeCloseTo(7500.00, 2);
    expect(parsed.totalDeductions).toBeCloseTo(2500.00, 2);
  });

  it('deve extrair com precisão absoluta o contracheque real PMPE AGO/2026 enviado pelo usuário', () => {
    const realContracheque = `
GOVERNO DO ESTADO DE PERNAMBUCO
POLICIA MILITAR DE PERNAMBUCO
CNPJ: 11.433.190/0001-57
NOME
PABLO RICARDO ALVES CAMPELO LOPES
MATRICULAS
4239075/1
006|1256734|
COMPETÊNCIA
AGO/2026
LOTAÇÃO
DIRETORIA DE TECNOLOGIA
IDENTIDADE
7959521 SSP PE
CPF
077.910.304-11
ADMISSÃO
26/01/2022
CARGO
60160 - SOLDADO
Tab: MLTPRACA
Matriz: I - SOLDADO
Classe: U
Faixa:
FUNÇÃO
ESPECIALIDADE: 810649 - SOLDADO - QPMG
BANCO/AGÊNCIA
BANCO BRADESCO S.A. - SHOPPING RECIFE RECIFE,PE
CONTA
00345334
DEP.IF
0
DEP.SF
0
MARGEM CONSIG.
R$ 329,74
BASE INSS
R$ 0,00
BASE FGTS
R$ 0,00
BASE IR
R$ 6.193,29
VANTAGENS
R$ 8.659,00
DESCONTOS
R$ 4.414,35
LÍQUIDO
R$ 4.244,65
 RUBRICA/COMPLEMENTO TP REFERÊNCIA COMPET VANTAGENS DESCONTOS
 3 - SOLDO 1 IU 08/26 R$ 5.617,92
 COMPLEMENTO: Normal
 ----------------------------------------------------------------------------------------------------
 81 - REMUN COMPL ART11 LEI 10426/9 1 CABO 08/26 R$ 575,37
 COMPLEMENTO: Normal
 ----------------------------------------------------------------------------------------------------
 201 - 1/3 FERIAS 1 08/26 R$ 2.064,43
 COMPLEMENTO: Normal
 ----------------------------------------------------------------------------------------------------
 502 - VALE REFEICAO 1 08/26 R$ 401,28
 COMPLEMENTO: Normal
 ----------------------------------------------------------------------------------------------------
 4003 - FUND PROTECAO SOCIAL MILIT 1 10.50% 08/26 R$ 650,30
 COMPLEMENTO: Normal
 ----------------------------------------------------------------------------------------------------
 4061 - Desconto de Imposto de Rend 1 7.453066% 1 Vinc 08/26 R$ 461,59
 COMPLEMENTO: Ferias
 ----------------------------------------------------------------------------------------------------
 4302 - COMPENS AD 1/3 REMUM FERIAS 1 08/26 R$ 2.064,43
 COMPLEMENTO: 2025 1
Tipo: 1 - Mês principal 2 - Retroativo 3 - Correção monet 4 - Lançam. manual 5 - Parcelamento

GOVERNO DO ESTADO DE PERNAMBUCO
POLICIA MILITAR DE PERNAMBUCO
CNPJ: 11.433.190/0001-57
NOME
PABLO RICARDO ALVES CAMPELO LOPES
MATRICULAS
4239075/1
006|1256734|
COMPETÊNCIA
AGO/2026
 RUBRICA/COMPLEMENTO TP REFERÊNCIA COMPET VANTAGENS DESCONTOS
 4506 - BRADESCO S/A 1 004/034 08/26 R$ 1.176,10
 COMPLEMENTO: EMPRESTIMO CONSIG 01
 ----------------------------------------------------------------------------------------------------
 5091 - SISMEPE 1 1.00% 08/26 R$ 61,93
 COMPLEMENTO: CONTRIB MENSAL
Tipo: 1 - Mês principal 2 - Retroativo 3 - Correção monet 4 - Lançam. manual 5 - Parcelamento
    `;

    const parsed = parseContrachequeText(realContracheque);

    expect(parsed.referenceMonth).toBe('2026-08');
    expect(parsed.grossSalary).toBeCloseTo(8659.00, 2);
    expect(parsed.netSalary).toBeCloseTo(4244.65, 2);
    expect(parsed.totalDeductions).toBeCloseTo(4414.35, 2);
    expect(parsed.deductions.length).toBe(5);

    // Validar descontos extraídos
    const d4003 = parsed.deductions.find((d) => d.name.includes('4003'));
    expect(d4003?.amount).toBeCloseTo(650.30, 2);
    expect(d4003?.category).toBe('Impostos & Taxas');

    const d4061 = parsed.deductions.find((d) => d.name.includes('4061'));
    expect(d4061?.amount).toBeCloseTo(461.59, 2);
    expect(d4061?.category).toBe('Impostos & Taxas');

    const d4302 = parsed.deductions.find((d) => d.name.includes('4302'));
    expect(d4302?.amount).toBeCloseTo(2064.43, 2);

    const d4506 = parsed.deductions.find((d) => d.name.includes('4506'));
    expect(d4506?.amount).toBeCloseTo(1176.10, 2);
    expect(d4506?.category).toBe('Financiamentos & Empréstimos');

    const d5091 = parsed.deductions.find((d) => d.name.includes('5091'));
    expect(d5091?.amount).toBeCloseTo(61.93, 2);
    expect(d5091?.category).toBe('Saúde');
  });
});
