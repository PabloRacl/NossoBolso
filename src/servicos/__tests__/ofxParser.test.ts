import { describe, it, expect } from 'vitest';
import { parseOFX } from '../ofxParser';

describe('ofxParser - Parser de Extrato Bancário OFX', () => {
  const sampleOFX = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20260215120000
            <TRNAMT>-45.80
            <MEMO>UBER TRIP RIO DE JANEIRO
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20260216
            <TRNAMT>-120.50
            <MEMO>IFOOD *RESTAURANTE BOA VISTA
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20260205
            <TRNAMT>5450.00
            <MEMO>PAGTO SALARIO EMPRESA
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20260218
            <TRNAMT>-55.90
            <NAME>NETFLIX.COM MENSL
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20260220
            <TRNAMT>-200.00
            <MEMO>POSTO IPIRANGA COMBUSTIVEL
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20260222
            <TRNAMT>0.00
            <MEMO>TARIFA ZERADA
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
  `;

  it('deve extrair transações válidas do conteúdo OFX e ignorar transações zeradas', () => {
    const transactions = parseOFX(sampleOFX);
    // Das 6 transações, a última tem valor 0.00 e deve ser ignorada
    expect(transactions.length).toBe(5);
  });

  it('deve converter datas de formato YYYYMMDD para ISO YYYY-MM-DD', () => {
    const transactions = parseOFX(sampleOFX);
    expect(transactions[0].date).toBe('2026-02-15');
    expect(transactions[1].date).toBe('2026-02-16');
    expect(transactions[2].date).toBe('2026-02-05');
  });

  it('deve classificar valores negativos como despesa (expense) e positivos como receita (income)', () => {
    const transactions = parseOFX(sampleOFX);

    const uber = transactions[0];
    expect(uber.type).toBe('expense');
    expect(uber.amount).toBeCloseTo(45.80, 2);

    const salario = transactions[2];
    expect(salario.type).toBe('income');
    expect(salario.amount).toBeCloseTo(5450.00, 2);
  });

  it('deve aplicar regras automáticas de sugestão de categorias', () => {
    const transactions = parseOFX(sampleOFX);

    // Uber -> Transporte
    expect(transactions[0].suggestedCategory).toBe('Transporte');
    // iFood -> Alimentação
    expect(transactions[1].suggestedCategory).toBe('Alimentação');
    // Salário -> Salário
    expect(transactions[2].suggestedCategory).toBe('Salário');
    // Netflix (usando tag NAME em vez de MEMO) -> Contas & Assinaturas
    expect(transactions[3].suggestedCategory).toBe('Contas & Assinaturas');
    // Posto -> Transporte
    expect(transactions[4].suggestedCategory).toBe('Transporte');
  });

  it('deve atribuir categoria genérica para transações sem palavras-chave reconhecidas', () => {
    const genericOFX = `
      <STMTTRN>
        <TRNTYPE>DEBIT
        <DTPOSTED>20260301
        <TRNAMT>-75.00
        <MEMO>COMPRA LOJA DIVERSA XYZ
      </STMTTRN>
      <STMTTRN>
        <TRNTYPE>CREDIT
        <DTPOSTED>20260302
        <TRNAMT>150.00
        <MEMO>PIX RECEBIDO JOAO
      </STMTTRN>
    `;
    const transactions = parseOFX(genericOFX);
    expect(transactions.length).toBe(2);
    expect(transactions[0].suggestedCategory).toBe('Outros (Despesa)');
    expect(transactions[1].suggestedCategory).toBe('Outros (Receita)');
  });

  it('deve tratar vírgula em valores decimais (ex: -12,50)', () => {
    const commaOFX = `
      <STMTTRN>
        <TRNTYPE>DEBIT
        <DTPOSTED>20260310
        <TRNAMT>-89,90
        <MEMO>PADARIA CENTRAL
      </STMTTRN>
    `;
    const transactions = parseOFX(commaOFX);
    expect(transactions.length).toBe(1);
    expect(transactions[0].amount).toBeCloseTo(89.90, 2);
    expect(transactions[0].type).toBe('expense');
    expect(transactions[0].suggestedCategory).toBe('Alimentação');
  });
});
