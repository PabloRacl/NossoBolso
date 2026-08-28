import Dexie, { type Table } from 'dexie';
import { Transaction, Category, Wallet, Goal, DebtContract } from '../types';

export class NossoBolsoDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  wallets!: Table<Wallet>;
  goals!: Table<Goal>;
  debtContracts!: Table<DebtContract>;

  constructor() {
    super('nosso-bolso-db');
    this.version(2).stores({
      transactions: 'id, date, type, category, walletId, isRecurring, contractId',
      categories: 'id, name, type',
      wallets: 'id, name, type',
      goals: 'id, name, deadline',
      debtContracts: 'id, title, startDate, walletId',
    });
  }
}

export const db = new NossoBolsoDB();

// Default Initial Data Seeding
export async function seedInitialData() {
  const walletCount = await db.wallets.count();
  if (walletCount === 0) {
    await db.wallets.bulkAdd([
      { id: 'w1', name: 'Conta Principal', type: 'checking', balance: 0, color: '#00FF88', icon: '🏦' },
      { id: 'w2', name: 'Cartão de Crédito', type: 'credit', balance: 0, creditLimit: 5000, color: '#EF4444', icon: '💳' },
      { id: 'w3', name: 'Reserva de Emergência', type: 'savings', balance: 0, color: '#06B6D4', icon: '🐷' },
    ]);
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd([
      // Income
      { id: 'c1', name: 'Salário', emoji: '💼', type: 'income' },
      { id: 'c2', name: 'Freelance', emoji: '💻', type: 'income' },
      { id: 'c3', name: 'Investimentos', emoji: '📊', type: 'income' },
      { id: 'c4', name: 'Vendas', emoji: '🛒', type: 'income' },
      { id: 'c5', name: 'Outros (Receita)', emoji: '💡', type: 'income' },
      // Expense
      { id: 'c6', name: 'Alimentação', emoji: '🍔', type: 'expense' },
      { id: 'c7', name: 'Moradia', emoji: '🏠', type: 'expense' },
      { id: 'c8', name: 'Transporte', emoji: '🚗', type: 'expense' },
      { id: 'c9', name: 'Saúde', emoji: '🏥', type: 'expense' },
      { id: 'c10', name: 'Educação', emoji: '📚', type: 'expense' },
      { id: 'c11', name: 'Lazer', emoji: '🎮', type: 'expense' },
      { id: 'c12', name: 'Contas & Assinaturas', emoji: '📄', type: 'expense' },
      { id: 'c13', name: 'Dívidas & Empréstimos', emoji: '💳', type: 'expense' },
      { id: 'c14', name: 'Financiamentos & Veículos', emoji: '🚗', type: 'expense' },
      { id: 'c15', name: 'Fatura de Cartão', emoji: '📉', type: 'expense' },
      { id: 'c16', name: 'Outros (Despesa)', emoji: '📦', type: 'expense' },
    ]);
  } else {
    // Ensure debt & financing categories exist even if db was already seeded
    const hasDebtCategory = await db.categories.get('c13');
    if (!hasDebtCategory) {
      await db.categories.bulkPut([
        { id: 'c13', name: 'Dívidas & Empréstimos', emoji: '💳', type: 'expense' },
        { id: 'c14', name: 'Financiamentos & Veículos', emoji: '🚗', type: 'expense' },
        { id: 'c15', name: 'Fatura de Cartão', emoji: '📉', type: 'expense' },
      ]);
    }
  }
}
