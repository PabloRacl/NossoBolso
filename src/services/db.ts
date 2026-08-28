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
const SEED_VERSION_KEY = 'nosso-bolso-seed-version';
const CURRENT_SEED_VERSION = '2';

interface MiniStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export async function seedInitialData() {
  const storage = typeof window !== 'undefined' ? window.localStorage : null;
  await performSeeding(db, storage);
}

export async function performSeeding(database: NossoBolsoDB, storage: MiniStorage | null) {
  if (storage) {
    const seededVersion = storage.getItem(SEED_VERSION_KEY);
    if (seededVersion === CURRENT_SEED_VERSION) {
      return; // Já foi semeado nesta versão
    }
  }

  // 1. Seed de Wallets (Verificar ID a ID)
  const defaultWallets = [
    { id: 'w1', name: 'Conta Principal', type: 'checking' as const, balance: 0, color: '#00FF88', icon: '🏦' },
    { id: 'w2', name: 'Cartão de Crédito', type: 'credit' as const, balance: 0, creditLimit: 5000, color: '#EF4444', icon: '💳' },
    { id: 'w3', name: 'Reserva de Emergência', type: 'savings' as const, balance: 0, color: '#06B6D4', icon: '🐷' },
  ];

  for (const wallet of defaultWallets) {
    const exists = await database.wallets.get(wallet.id);
    if (!exists) {
      await database.wallets.add(wallet);
    }
  }

  // 2. Seed de Categorias (Verificar ID a ID)
  const defaultCategories = [
    // Income
    { id: 'c1', name: 'Salário', emoji: '💼', type: 'income' as const },
    { id: 'c2', name: 'Freelance', emoji: '💻', type: 'income' as const },
    { id: 'c3', name: 'Investimentos', emoji: '📊', type: 'income' as const },
    { id: 'c4', name: 'Vendas', emoji: '🛒', type: 'income' as const },
    { id: 'c5', name: 'Outros (Receita)', emoji: '💡', type: 'income' as const },
    // Expense
    { id: 'c6', name: 'Alimentação', emoji: '🍔', type: 'expense' as const },
    { id: 'c7', name: 'Moradia', emoji: '🏠', type: 'expense' as const },
    { id: 'c8', name: 'Transporte', emoji: '🚗', type: 'expense' as const },
    { id: 'c9', name: 'Saúde', emoji: '🏥', type: 'expense' as const },
    { id: 'c10', name: 'Educação', emoji: '📚', type: 'expense' as const },
    { id: 'c11', name: 'Lazer', emoji: '🎮', type: 'expense' as const },
    { id: 'c12', name: 'Contas & Assinaturas', emoji: '📄', type: 'expense' as const },
    { id: 'c13', name: 'Dívidas & Empréstimos', emoji: '💳', type: 'expense' as const },
    { id: 'c14', name: 'Financiamentos & Veículos', emoji: '🚗', type: 'expense' as const },
    { id: 'c15', name: 'Fatura de Cartão', emoji: '📉', type: 'expense' as const },
    { id: 'c16', name: 'Outros (Despesa)', emoji: '📦', type: 'expense' as const },
  ];

  for (const cat of defaultCategories) {
    const exists = await database.categories.get(cat.id);
    if (!exists) {
      await database.categories.add(cat);
    }
  }

  // 3. Seed de Contratos e suas parcelas correspondentes (Verificar ID a ID)
  // Contrato 1: Caixa Habitação (SAC)
  const caixaContractId = 'debt_caixa_habitacao';
  const hasCaixa = await database.debtContracts.get(caixaContractId);
  if (!hasCaixa) {
    const caixaInstCount = 208; // parcelas restantes
    const caixaStartNum = 68;
    const caixaFinanced = 36862.23; // saldo devedor atual
    const caixaRate = 5; // 5% a.a.
    const caixaInsurance = 14.68;
    const caixaStartDate = '2026-09-11';

    await database.debtContracts.add({
      id: caixaContractId,
      title: 'Caixa Habitação',
      totalInstallments: caixaStartNum + caixaInstCount - 1, // 275 total
      installmentAmount: caixaFinanced / caixaInstCount,
      totalAmount: caixaFinanced,
      interestRate: caixaRate,
      interestRateType: 'yearly',
      amortizationSystem: 'sac',
      insuranceAmount: caixaInsurance,
      startInstallmentNum: caixaStartNum,
      startDate: caixaStartDate,
      category: 'Moradia',
      walletId: 'w1',
      createdAt: new Date().toISOString()
    });

    const caixaTxs = [];
    const caixaBaseDate = new Date(caixaStartDate + 'T12:00:00');
    const monthlyRate = caixaRate / 12 / 100;
    const monthlyAmortization = caixaFinanced / caixaInstCount;
    let runningBalance = caixaFinanced;

    for (let i = 1; i <= caixaInstCount; i++) {
      const currentNum = caixaStartNum + i - 1;
      const txDate = new Date(caixaBaseDate);
      txDate.setMonth(caixaBaseDate.getMonth() + (i - 1));
      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, '0');
      const dd = String(txDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const periodInterest = runningBalance * monthlyRate;
      const periodTotal = monthlyAmortization + periodInterest + caixaInsurance;
      const roundedTotal = Math.round(periodTotal * 100) / 100;

      caixaTxs.push({
        id: `tx_${caixaContractId}_${currentNum}`,
        description: `Caixa Habitação (${currentNum}/275)`,
        amount: roundedTotal,
        date: formattedDate,
        type: 'expense' as const,
        category: 'Moradia',
        walletId: 'w1',
        contractId: caixaContractId,
        installments: {
          current: currentNum,
          total: caixaStartNum + caixaInstCount - 1,
        },
        createdAt: new Date().toISOString()
      });

      runningBalance -= monthlyAmortization;
    }
    await database.transactions.bulkAdd(caixaTxs);
  }

  // Contrato 2: HB20
  const carContractId = 'debt_carro_hb20';
  const hasCar = await database.debtContracts.get(carContractId);
  if (!hasCar) {
    const carInstCount = 36;
    const carInstVal = 850;
    const carTotalAmount = carInstCount * carInstVal;
    const carStartDate = '2026-08-15';

    await database.debtContracts.add({
      id: carContractId,
      title: 'Financiamento Carro HB20',
      totalInstallments: carInstCount,
      installmentAmount: carInstVal,
      totalAmount: carTotalAmount,
      interestRate: 1.5,
      interestRateType: 'monthly',
      amortizationSystem: 'price',
      startDate: carStartDate,
      category: 'Transporte',
      walletId: 'w1',
      createdAt: new Date().toISOString()
    });

    const carTxs = [];
    const carBaseDate = new Date(carStartDate + 'T12:00:00');
    for (let i = 1; i <= carInstCount; i++) {
      const txDate = new Date(carBaseDate);
      txDate.setMonth(carBaseDate.getMonth() + (i - 1));
      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, '0');
      const dd = String(txDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      carTxs.push({
        id: `tx_${carContractId}_${i}`,
        description: `Financiamento Carro HB20 (${i}/36)`,
        amount: carInstVal,
        date: formattedDate,
        type: 'expense' as const,
        category: 'Transporte',
        walletId: 'w1',
        contractId: carContractId,
        installments: {
          current: i,
          total: carInstCount,
        },
        createdAt: new Date().toISOString()
      });
    }
    await database.transactions.bulkAdd(carTxs);
  }

  if (storage) {
    storage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
  }
}
