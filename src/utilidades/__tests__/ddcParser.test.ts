import { describe, it, expect } from 'vitest';
import { parseDDCText } from '../ddcParser';

describe('ddcParser - Parser de Documento Descritivo de Crédito (DDC)', () => {
  it('deve extrair com precisão total os dados do DDC Bradesco enviado pelo usuário', () => {
    const rawDDCText = `
Documento Descritivo de Crédito - Documento de Evolução de Dívida
Mod.:4840-1276E Versão: 06/2026 1 / 2
Características do Contrato
Emissão 08/09/2026
Nome
PABLO RICARDO ALVES CAMPELO LOPES
CPF/CNPJ
077.910.304-11
Modalidade de Operação
Portab Consignado Público
Valor da Operação
R$ 32.672,95
Número do Contrato
555356810
Data e Hora da Contratação
18/02/2026 21:38:04
Sistema de Pagamento
DEBITO EM CONTA CORRENTE
Data Liberação do Crédito
18/02/2026
Data do Último Vencimento
07/03/2029
Canal de Contratação
066 MOBILE BANK PF
Taxa de Juros Mensal Nominal
1,41 % a.m.
Taxa de Juros Anual Nominal
18,296 % a.a.
Taxa de Juros Efetiva (CET)
1,43 % a.m. 18,57 % a.a.
Tributos
R$ 0,00
Seguros
NAO SE APLICA
Tarifas
R$ 0,00
Registros
R$ 0,00
Pagtos. Servs. Terceiros
R$ 0,00
Resumo
Prazo Total da Operação
36
Prazo Remanescente
19
Saldo Devedor Atualizado
R$ 19.474,33
Demonstrativo da Demonstrativo da Evolução do Saldo Devedor/Composição do Valor das Parcelas (R$)
Nro Parcela Vencimento da Parcela Valor Parcela Valor Principal da Parcela Valor dos Juros /Encargos Saldo Devedor Atual da Parcela Situação da Parcela
1 31/03/2026 R$ 1.176,10 R$ 558,38 R$ 617,72 R$ 0,00 PARCELA PAGA
2 30/04/2026 R$ 1.176,10 R$ 733,15 R$ 442,95 R$ 0,00 PARCELA PAGA
3 29/05/2026 R$ 1.176,10 R$ 758,00 R$ 418,10 R$ 0,00 PARCELA PAGA
4 22/06/2026 R$ 1.176,10 R$ 855,84 R$ 320,26 R$ 0,00 PARCELA PAGA
5 31/07/2026 R$ 1.176,10 R$ 697,85 R$ 478,25 R$ 0,00 PARCELA PAGA
6 31/08/2026 R$ 1.176,10 R$ 880,29 R$ 295,81 R$ 0,00 PARCELA PAGA
7 30/09/2026 R$ 1.176,10 R$ 902,32 R$ 273,78 R$ 1.164,08 PARCELA A VENCER
8 30/10/2026 R$ 1.176,10 R$ 915,06 R$ 261,04 R$ 1.147,88 PARCELA A VENCER
9 30/11/2026 R$ 1.176,10 R$ 919,64 R$ 256,46 R$ 1.131,38 PARCELA A VENCER
10 30/12/2026 R$ 1.176,10 R$ 940,95 R$ 235,15 R$ 1.115,64 PARCELA A VENCER
11 05/02/2027 R$ 1.176,10 R$ 902,00 R$ 274,10 R$ 1.096,52 PARCELA A VENCER
12 05/03/2027 R$ 1.176,10 R$ 980,99 R$ 195,11 R$ 1.082,27 PARCELA A VENCER
13 07/04/2027 R$ 1.176,10 R$ 961,11 R$ 214,99 R$ 1.065,72 PARCELA A VENCER
14 07/05/2027 R$ 1.176,10 R$ 994,36 R$ 181,74 R$ 1.050,89 PARCELA A VENCER
15 07/06/2027 R$ 1.176,10 R$ 1.002,76 R$ 173,34 R$ 1.035,78 PARCELA A VENCER
16 07/07/2027 R$ 1.176,10 R$ 1.022,54 R$ 153,56 R$ 1.021,37 PARCELA A VENCER
17 06/08/2027 R$ 1.176,10 R$ 1.036,97 R$ 139,13 R$ 1.007,16 PARCELA A VENCER
18 08/09/2027 R$ 1.176,10 R$ 1.039,05 R$ 137,05 R$ 991,75 PARCELA A VENCER
19 07/10/2027 R$ 1.176,10 R$ 1.069,95 R$ 106,15 R$ 978,41 PARCELA A VENCER
20 08/11/2027 R$ 1.176,10 R$ 1.075,00 R$ 101,10 R$ 963,90 PARCELA A VENCER
21 07/12/2027 R$ 1.176,10 R$ 1.099,20 R$ 76,90 R$ 950,93 PARCELA A VENCER
22 07/01/2028 R$ 1.176,10 R$ 1.109,89 R$ 66,21 R$ 937,26 PARCELA A VENCER
23 07/02/2028 R$ 1.176,10 R$ 1.126,08 R$ 50,02 R$ 923,79 PARCELA A VENCER 

Documento Descritivo de Crédito - Documento de Evolução de Dívida
Mod.:4840-1276E Versão: 06/2026 2 / 2
24 07/03/2028 R$ 1.176,10 R$ 1.144,68 R$ 31,42 R$ 911,36 PARCELA A VENCER
25 07/04/2028 R$ 1.176,10 R$ 1.159,15 R$ 16,95 R$ 898,26 PARCELA A VENCER
26 08/05/2028 R$ 877,11 R$ 869,36 R$ 7,75 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
27 07/06/2028 R$ 864,10 R$ 857,27 R$ 6,83 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
28 07/07/2028 R$ 852,08 R$ 845,34 R$ 6,74 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
29 07/08/2028 R$ 839,83 R$ 833,19 R$ 6,64 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
30 08/09/2028 R$ 827,37 R$ 820,83 R$ 6,54 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
31 06/10/2028 R$ 816,62 R$ 810,16 R$ 6,46 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
32 08/11/2028 R$ 786,30 R$ 783,37 R$ 2,93 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
33 07/12/2028 R$ 775,72 R$ 772,83 R$ 2,89 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
34 08/01/2029 R$ 754,19 R$ 753,13 R$ 1,06 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
35 07/02/2029 R$ 743,70 R$ 742,66 R$ 1,04 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
36 07/03/2029 R$ 709,13 R$ 699,60 R$ 9,53 R$ 0,00 PARCELA LIQUIDADA ANTECIPADAMENTE
    `;

    const parsed = parseDDCText(rawDDCText);

    expect(parsed.institution).toBe('Banco Bradesco S.A.');
    expect(parsed.contractNumber).toBe('555356810');
    expect(parsed.modality).toBe('Portab Consignado Público');
    expect(parsed.totalOperationAmount).toBeCloseTo(32672.95, 2);
    expect(parsed.currentDebtBalance).toBeCloseTo(19474.33, 2);
    expect(parsed.installmentAmount).toBeCloseTo(1176.10, 2);
    expect(parsed.monthlyInterestRate).toBeCloseTo(1.41, 2);
    expect(parsed.amortizationSystem).toBe('price');

    // 36 parcelas totais
    expect(parsed.totalInstallments).toBe(36);
    expect(parsed.installments.length).toBe(36);

    // 6 parcelas pagas no fluxo normal
    expect(parsed.paidCount).toBe(6);

    // 19 parcelas a vencer
    expect(parsed.remainingInstallments).toBe(19);

    // 11 parcelas liquidadas antecipadamente
    expect(parsed.liquidatedEarlyCount).toBe(11);

    // Próxima parcela a vencer: Parcela 7 com vencimento em 30/09/2026
    expect(parsed.nextInstallmentNumber).toBe(7);
    expect(parsed.nextDueDate).toBe('2026-09-30');

    // Validar parcela 1 (paga)
    expect(parsed.installments[0].status).toBe('paid');
    expect(parsed.installments[0].dueDate).toBe('2026-03-31');

    // Validar parcela 7 (a vencer)
    expect(parsed.installments[6].status).toBe('open');
    expect(parsed.installments[6].dueDate).toBe('2026-09-30');
    expect(parsed.installments[6].amount).toBeCloseTo(1176.10, 2);

    // Validar parcela 36 (liquidada antecipadamente)
    expect(parsed.installments[35].status).toBe('liquidated_early');
    expect(parsed.installments[35].dueDate).toBe('2029-03-07');
  });

  it('deve extrair com precisão total o contrato habitacional da CAIXA (SAC / 360 meses)', () => {
    const rawCaixaText = `
CAIXA Demonstrativo de Evolução - Habitação
DADOS DO CLIENTE / DADOS DO IMÓVEL DATA GERAÇÃO: 08/09/2026 EXTRATO DE EVOLUÇÃO DO SALDO
Contrato 844440603285-9
Nome PABLO RICARDO ALVES CAMPELO LOPES
CPF/CGC 077.910.304-11
Endereço R HON RIO THIAGO MARINHO 339 BOA ESPERAN A
ARCOVERDE PE 56500000
Saldo Devedor Teórico em 11/08/26
Valor R$ 36.862,23
Juros/Correção do Mês R$ 0,00
Amortização do Mês R$ 0,00
Indexador do Saldo POUPANCA/FGTS NO SFH

DADOS DO CONTRATO
Prazo do Financiamento 360 meses
Prazo Remanescente 208 meses
Taxa de Juros Contratual Nominal 5%
Taxa de Juros Nominal com Relacionamento 5%
Sistema de Amortização SAC
Agência de Contrato 0915-6

DESCRIÇÃO DAS ÚLTIMAS PRESTAÇÕES/DEVOLUÇÕES
Data Vencimento Data Pagamento Nº Tipo Amortização + Juros Seguro Taxas Administração Subsídio Governo/ Bônus Diferencial de Juros + TR FGTS Quota/ Valor Mora/ Multa Devido Pago Diferença de Pagamento
11/09/2026 01/09/2026 68 310 329,85 14,68 0,00 0,00 0,00 0 / 0,00 0,00 344,53 344,53 0,00
11/08/2026 03/08/2026 67 310 330,32 14,69 0,00 0,00 0,00 0 / 0,00 0,00 345,01 345,01 0,00
11/07/2026 29/06/2026 66 310 330,79 14,71 0,00 0,00 0,00 0 / 0,00 0,00 345,50 345,50 0,00
11/06/2026 29/05/2026 65 310 331,26 14,72 0,00 0,00 0,00 0 / 0,00 0,00 345,98 345,98 0,00
11/05/2026 11/05/2026 64 310 331,73 14,73 0,00 0,00 0,00 0 / 0,00 0,00 346,46 346,46 0,00
11/04/2026 01/04/2026 63 310 328,58 14,74 0,00 0,00 0,00 0 / 0,00 0,00 343,32 343,32 0,00
11/03/2026 27/02/2026 62 310 329,02 14,75 0,00 0,00 0,00 0 / 0,00 0,00 343,77 343,77 0,00
11/02/2026 30/01/2026 61 310 329,55 14,77 0,00 0,00 0,00 0 / 0,00 0,00 344,32 344,32 0,00
11/01/2026 02/01/2026 60 310 330,00 14,78 0,00 0,00 0,00 0 / 0,00 0,00 344,78 344,78 0,00
11/12/2025 01/12/2025 59 310 330,45 14,79 0,00 0,00 0,00 0 / 0,00 0,00 345,24 345,24 0,00
11/11/2025 03/11/2025 58 310 330,91 14,81 0,00 0,00 0,00 0 / 0,00 0,00 345,72 345,72 0,00
11/10/2025 02/10/2025 57 310 331,35 14,82 0,00 0,00 0,00 0 / 0,00 0,00 346,17 346,17 0,00
TOTAL DA DIFERENÇA ATUALIZADA R$ 0,00
    `;

    const parsed = parseDDCText(rawCaixaText);

    expect(parsed.institution).toBe('Caixa Econômica Federal');
    expect(parsed.contractNumber).toBe('844440603285-9');
    expect(parsed.currentDebtBalance).toBeCloseTo(36862.23, 2);
    expect(parsed.totalInstallments).toBe(360);
    expect(parsed.remainingInstallments).toBe(208);
    expect(parsed.amortizationSystem).toBe('sac');
    expect(parsed.paidCount).toBe(152); // 360 - 208 amortizadas/pagas
    expect(parsed.nextInstallmentNumber).toBe(69);
    expect(parsed.nextDueDate).toBe('2026-10-11');
    expect(parsed.installmentAmount).toBeCloseTo(344.53, 2);
    expect(parsed.propertyAddress).toContain('ARCOVERDE PE');
  });
});
