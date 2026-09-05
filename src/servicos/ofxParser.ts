import { OFXTransaction, TransactionType } from '../tipos';

export function parseOFX(ofxContent: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];
  
  // Extract STMTTRN blocks
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  while ((match = trnRegex.exec(ofxContent)) !== null) {
    const block = match[1];
    
    const trntypeMatch = /<TRNTYPE>(.*?)(?:\r|\n|<)/i.exec(block);
    const dtpostedMatch = /<DTPOSTED>(.*?)(?:\r|\n|<)/i.exec(block);
    const trnamtMatch = /<TRNAMT>(.*?)(?:\r|\n|<)/i.exec(block);
    const memoMatch = /<MEMO>(.*?)(?:\r|\n|<)/i.exec(block) || /<NAME>(.*?)(?:\r|\n|<)/i.exec(block);

    const rawAmt = parseFloat(trnamtMatch ? trnamtMatch[1].replace(',', '.') : '0');
    if (isNaN(rawAmt) || rawAmt === 0) continue;

    const type: TransactionType = rawAmt > 0 ? 'income' : 'expense';
    const amount = Math.abs(rawAmt);

    // Format date YYYYMMDD -> YYYY-MM-DD
    const rawDate = dtpostedMatch ? dtpostedMatch[1].trim() : '';
    let dateStr = new Date().toISOString().split('T')[0];
    if (rawDate.length >= 8) {
      dateStr = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
    }

    const description = memoMatch ? memoMatch[1].trim() : 'Transação Importada';
    
    // Auto-categorization rules
    let suggestedCategory = type === 'income' ? 'Outros (Receita)' : 'Outros (Despesa)';
    const descLower = description.toLowerCase();

    if (descLower.includes('uber') || descLower.includes('99') || descLower.includes('posto') || descLower.includes('gasolina')) {
      suggestedCategory = 'Transporte';
    } else if (descLower.includes('ifood') || descLower.includes('restaurante') || descLower.includes('mercado') || descLower.includes('padaria')) {
      suggestedCategory = 'Alimentação';
    } else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('prime') || descLower.includes('steam')) {
      suggestedCategory = 'Contas & Assinaturas';
    } else if (descLower.includes('salario') || descLower.includes('pagto') || descLower.includes('rendimento')) {
      suggestedCategory = 'Salário';
    }

    transactions.push({
      id: Math.random().toString(36).substring(2, 9),
      date: dateStr,
      amount,
      type,
      description,
      suggestedCategory,
    });
  }

  return transactions;
}
