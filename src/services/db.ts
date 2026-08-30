import Dexie, { type Table } from 'dexie';
import { Transaction, Category, Wallet, Goal, DebtContract, Budget, RecurringTransaction, PantryItem, VehicleRecord, Vehicle, ComponentSpec } from '../types';

export class NossoBolsoDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  wallets!: Table<Wallet>;
  goals!: Table<Goal>;
  debtContracts!: Table<DebtContract>;
  budgets!: Table<Budget>;
  recurringTransactions!: Table<RecurringTransaction>;
  pantryItems!: Table<PantryItem>;
  vehicleRecords!: Table<VehicleRecord>;
  vehicles!: Table<Vehicle>;
  componentSpecs!: Table<ComponentSpec>;

  constructor() {
    super('nosso-bolso-db');
    this.version(7).stores({
      transactions: 'id, date, type, category, walletId, isRecurring, contractId',
      categories: 'id, name, type',
      wallets: 'id, name, type',
      goals: 'id, name, deadline',
      debtContracts: 'id, title, startDate, walletId',
      budgets: 'id, category',
      recurringTransactions: 'id, category, walletId, dayOfMonth',
      pantryItems: 'id, name, category',
      vehicleRecords: 'id, vehicleName, vehicleId, type, date',
      vehicles: 'id, name, isMain',
      componentSpecs: 'id, vehicleId, category',
    });
  }
}

export const db = new NossoBolsoDB();

// Garantir fechamento automático do DB para upgrade sem conflitos entre abas
db.on('versionchange', () => {
  db.close();
});

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

  // 4. Seed de Itens de Estoque Doméstico
  const defaultPantry = [
    { id: 'pi_1', name: 'Leite Integral 1L', category: 'Laticínios', unit: 'L', idealQuantity: 12, currentQuantity: 2, lastPrice: 5.50, createdAt: new Date().toISOString() },
    { id: 'pi_2', name: 'Arroz Tipo 1 (5kg)', category: 'Alimentos', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 28.90, createdAt: new Date().toISOString() },
    { id: 'pi_3', name: 'Feijão Carioca 1kg', category: 'Alimentos', unit: 'pct', idealQuantity: 4, currentQuantity: 1, lastPrice: 8.20, createdAt: new Date().toISOString() },
    { id: 'pi_4', name: 'Café Tradicional 500g', category: 'Alimentos', unit: 'pct', idealQuantity: 3, currentQuantity: 1, lastPrice: 16.50, createdAt: new Date().toISOString() },
    { id: 'pi_5', name: 'Sabão em Pó 1kg', category: 'Limpeza', unit: 'cx', idealQuantity: 3, currentQuantity: 0, lastPrice: 14.90, createdAt: new Date().toISOString() },
    { id: 'pi_6', name: 'Detergente Líquido 500ml', category: 'Limpeza', unit: 'un', idealQuantity: 6, currentQuantity: 2, lastPrice: 2.80, createdAt: new Date().toISOString() },
    { id: 'pi_7', name: 'Papel Higiênico 12un', category: 'Higiene', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 19.90, createdAt: new Date().toISOString() },
    { id: 'pi_8', name: 'Óleo de Soja 900ml', category: 'Alimentos', unit: 'un', idealQuantity: 4, currentQuantity: 1, lastPrice: 6.90, createdAt: new Date().toISOString() },
  ];

  for (const item of defaultPantry) {
    const exists = await database.pantryItems.get(item.id);
    if (!exists) {
      await database.pantryItems.add(item);
    }
  }

  // 5. Seed de Registros Automotivos
  const defaultVehicles: VehicleRecord[] = [
    {
      id: 'vr_1',
      vehicleName: 'Honda Civic 2.0',
      type: 'refuel',
      date: '2026-08-10',
      odometerKm: 45200,
      totalCost: 220.00,
      liters: 40.0,
      pricePerLiter: 5.50,
      fuelType: 'gasoline',
      description: 'Abastecimento Posto BR',
      walletId: 'w1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'vr_2',
      vehicleName: 'Honda Civic 2.0',
      type: 'refuel',
      date: '2026-08-22',
      odometerKm: 45720,
      totalCost: 231.00,
      liters: 42.0,
      pricePerLiter: 5.50,
      fuelType: 'gasoline',
      description: 'Abastecimento Posto Shell',
      walletId: 'w1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'vr_3',
      vehicleName: 'Honda Civic 2.0',
      type: 'maintenance',
      date: '2026-08-15',
      odometerKm: 45400,
      totalCost: 350.00,
      description: 'Troca de Óleo 10w30 + Filtro de Óleo e Ar',
      walletId: 'w1',
      createdAt: new Date().toISOString(),
    },
  ];

  for (const v of defaultVehicles) {
    const exists = await database.vehicleRecords.get(v.id);
    if (!exists) {
      await database.vehicleRecords.add(v);
    }
  }

  // 6. Seed de Veículos da Garagem
  const defaultGarageVehicle = {
    id: 'veh_onix',
    name: 'Chevrolet Onix 1.0 LT (2017/2018)',
    plate: 'ONX-2018',
    yearModel: '2017/2018',
    odometerKm: 45400,
    engineSpecs: '1.0 SPE/4 Eco (80 cv) • Câmbio 6M',
    recommendedOil: '5W30 Dexos1 Gen2 (3.5L)',
    tireSpecs: '185/65 R15 (35 PSI)',
    fuelType: 'flex' as const,
    color: 'Preto Ouro Negro',
    isMain: true,
    createdAt: new Date().toISOString(),
  };

  const vExists = await database.vehicles.get(defaultGarageVehicle.id);
  if (!vExists) {
    await database.vehicles.add(defaultGarageVehicle);
  }

  if (storage) {
    storage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
  }
}

export async function processRecurringTransactions() {
  if (typeof window === 'undefined') return;
  const now = new Date();
  const currentMonthKey = now.toISOString().substring(0, 7);
  const currentDay = now.getDate();

  try {
    const recurrings = await db.recurringTransactions.toArray();

    for (const item of recurrings) {
      if (item.lastGeneratedMonth !== currentMonthKey && currentDay >= item.dayOfMonth) {
        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
        const dayStr = String(item.dayOfMonth).padStart(2, '0');
        const txDate = `${now.getFullYear()}-${monthStr}-${dayStr}`;

        const newTx: Transaction = {
          id: `tx_rec_${item.id}_${currentMonthKey}`,
          description: `${item.description} (Recorrente)`,
          amount: item.amount,
          date: txDate,
          type: item.type,
          category: item.category,
          walletId: item.walletId,
          isRecurring: true,
          createdAt: new Date().toISOString(),
        };

        await db.transactions.add(newTx);

        const wallet = await db.wallets.get(item.walletId);
        if (wallet) {
          const delta = item.type === 'income' ? item.amount : -item.amount;
          await db.wallets.update(item.walletId, { balance: wallet.balance + delta });
        }

        await db.recurringTransactions.update(item.id, { lastGeneratedMonth: currentMonthKey });
      }
    }
  } catch (err) {
    console.error('Erro ao processar transações recorrentes:', err);
  }
}

export async function generateFullTestDataset() {
  // Limpar dados anteriores para simular um ambiente de testes completo
  await db.transactions.clear();
  await db.wallets.clear();
  await db.categories.clear();
  await db.goals.clear();
  await db.debtContracts.clear();
  await db.budgets.clear();
  await db.pantryItems.clear();
  await db.vehicleRecords.clear();
  await db.vehicles.clear();

  // 1. Wallets
  const testWallets: Wallet[] = [
    { id: 'w1', name: 'Conta Corrente Itaú', type: 'checking', balance: 8650.00, color: '#EC7000', icon: '🟠', bankName: 'Itaú', lastDigits: '4829' },
    { id: 'w2', name: 'Nubank Cartão de Crédito', type: 'credit', balance: -1150.00, creditLimit: 8000, color: '#8A05BE', icon: '🟣', bankName: 'Nubank', lastDigits: '9102', closingDay: 20, dueDay: 27 },
    { id: 'w3', name: 'Reserva BTG Pactual', type: 'savings', balance: 25000.00, yieldRateCdi: 100, color: '#0F223D', icon: '🌌', bankName: 'BTG Pactual' },
    { id: 'w4', name: 'Banco Inter', type: 'checking', balance: 3420.00, color: '#FF7A00', icon: '🍊', bankName: 'Inter', lastDigits: '1540' },
    { id: 'w5', name: 'Dinheiro Vivo', type: 'checking', balance: 350.00, color: '#00FF88', icon: '💵', bankName: 'Dinheiro' },
  ];
  await db.wallets.bulkAdd(testWallets);

  // 2. Categories
  const testCategories: Category[] = [
    { id: 'c1', name: 'Salário', emoji: '💼', type: 'income' },
    { id: 'c2', name: 'Freelance', emoji: '💻', type: 'income' },
    { id: 'c3', name: 'Investimentos', emoji: '📊', type: 'income' },
    { id: 'c4', name: 'Vendas', emoji: '🛒', type: 'income' },
    { id: 'c5', name: 'Outros (Receita)', emoji: '💡', type: 'income' },
    { id: 'c6', name: 'Alimentação & Mercado', emoji: '🍔', type: 'expense' },
    { id: 'c7', name: 'Moradia & Contas', emoji: '🏠', type: 'expense' },
    { id: 'c8', name: 'Transporte & Combustível', emoji: '🚗', type: 'expense' },
    { id: 'c9', name: 'Saúde & Farmácia', emoji: '🏥', type: 'expense' },
    { id: 'c10', name: 'Educação', emoji: '📚', type: 'expense' },
    { id: 'c11', name: 'Lazer & Restaurantes', emoji: '🎮', type: 'expense' },
    { id: 'c12', name: 'Impostos & Taxas', emoji: '📄', type: 'expense' },
    { id: 'c13', name: 'Financiamentos & Dívidas', emoji: '💳', type: 'expense' },
  ];
  await db.categories.bulkAdd(testCategories);

  // 3. Transactions para Mês Atual (2026-08), Mês Anterior (2026-07) e (2026-06)
  const testTransactions: Transaction[] = [
    // 2026-08 (Mês Atual)
    { id: `t_rec_1`, description: 'Salário Bruto - Polícia Militar PMPE', amount: 8659.00, date: '2026-08-31', type: 'income', category: 'Salário', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_desc_1`, description: 'Desconto Folha: Fund. Proteção Social (10.5%)', amount: 650.30, date: '2026-08-31', type: 'expense', category: 'Impostos & Taxas', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_desc_2`, description: 'Desconto Folha: IRRF Imposto de Renda', amount: 461.59, date: '2026-08-31', type: 'expense', category: 'Impostos & Taxas', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_desc_3`, description: 'Desconto Folha: Consignado Bradesco 01', amount: 1176.10, date: '2026-08-31', type: 'expense', category: 'Financiamentos & Dívidas', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_desc_4`, description: 'Desconto Folha: SISMEPE Plano Saúde', amount: 61.93, date: '2026-08-31', type: 'expense', category: 'Saúde & Farmácia', walletId: 'w1', createdAt: new Date().toISOString() },
    
    { id: `t_exp_1`, description: 'Supermercado Carrefour Semana 3', amount: 780.50, date: '2026-08-22', type: 'expense', category: 'Alimentação & Mercado', walletId: 'w2', createdAt: new Date().toISOString() },
    { id: `t_exp_2`, description: 'Abastecimento Posto Shell (42L Gasolina)', amount: 231.00, date: '2026-08-20', type: 'expense', category: 'Transporte & Combustível', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_exp_3`, description: 'Troca de Óleo 5w30 + Filtros (Civic)', amount: 350.00, date: '2026-08-15', type: 'expense', category: 'Transporte & Combustível', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_exp_4`, description: 'Plano Internet Fibra 500 Mega', amount: 120.00, date: '2026-08-10', type: 'expense', category: 'Moradia & Contas', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_exp_5`, description: 'Jantar Restaurante Outback', amount: 145.00, date: '2026-08-08', type: 'expense', category: 'Lazer & Restaurantes', walletId: 'w2', createdAt: new Date().toISOString() },
    { id: `t_rec_2`, description: 'Rendimento CDB 100% CDI Reserva', amount: 265.00, date: '2026-08-05', type: 'income', category: 'Investimentos', walletId: 'w3', createdAt: new Date().toISOString() },
    { id: `t_rec_3`, description: 'Venda OLX Monitor Gamer Usado', amount: 450.00, date: '2026-08-02', type: 'income', category: 'Vendas', walletId: 'w4', createdAt: new Date().toISOString() },

    // 2026-07 (Mês Anterior)
    { id: `t_rec_07_1`, description: 'Salário Bruto - Polícia Militar PMPE', amount: 8659.00, date: '2026-07-31', type: 'income', category: 'Salário', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_exp_07_1`, description: 'Compras Mês Atacadão', amount: 890.00, date: '2026-07-25', type: 'expense', category: 'Alimentação & Mercado', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_exp_07_2`, description: 'Abastecimento Posto BR', amount: 215.00, date: '2026-07-18', type: 'expense', category: 'Transporte & Combustível', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_exp_07_3`, description: 'Farmácia Drogasil Medicamentos', amount: 110.00, date: '2026-07-10', type: 'expense', category: 'Saúde & Farmácia', walletId: 'w2', createdAt: new Date().toISOString() },

    // 2026-06
    { id: `t_rec_06_1`, description: 'Salário Bruto - Polícia Militar PMPE', amount: 8659.00, date: '2026-06-30', type: 'income', category: 'Salário', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: `t_exp_06_1`, description: 'Pousada Viagem Fim de Semana', amount: 650.00, date: '2026-06-20', type: 'expense', category: 'Lazer & Restaurantes', walletId: 'w2', createdAt: new Date().toISOString() },
    { id: `t_exp_06_2`, description: 'Feira & Mercado Semanal', amount: 720.00, date: '2026-06-15', type: 'expense', category: 'Alimentação & Mercado', walletId: 'w1', createdAt: new Date().toISOString() },
  ];
  await db.transactions.bulkAdd(testTransactions);

  // 4. Budgets (Tetos)
  const testBudgets: Budget[] = [
    { id: 'b1', category: 'Alimentação & Mercado', monthlyLimit: 1200 },
    { id: 'b2', category: 'Transporte & Combustível', monthlyLimit: 600 },
    { id: 'b3', category: 'Moradia & Contas', monthlyLimit: 1500 },
    { id: 'b4', category: 'Lazer & Restaurantes', monthlyLimit: 400 },
    { id: 'b5', category: 'Saúde & Farmácia', monthlyLimit: 300 },
  ];
  await db.budgets.bulkAdd(testBudgets);

  // 5. Metas (Goals)
  const testGoals: Goal[] = [
    { id: 'g1', name: 'Reserva de Emergência (6 Meses)', targetAmount: 30000, currentAmount: 25000, deadline: '2026-12-31', color: '#00FF88', createdAt: new Date().toISOString() },
    { id: 'g2', name: 'Troca de Veículo SUV', targetAmount: 50000, currentAmount: 12000, deadline: '2027-06-30', color: '#38BDF8', createdAt: new Date().toISOString() },
    { id: 'g3', name: 'Viagem de Férias Família', targetAmount: 6000, currentAmount: 4500, deadline: '2026-11-15', color: '#F59E0B', createdAt: new Date().toISOString() },
  ];
  await db.goals.bulkAdd(testGoals);

  // 6. Veículos & Manutenções
  const testVehicles: Vehicle[] = [
    {
      id: 'veh_civic',
      name: 'Honda Civic 2.0 EXL (2020)',
      plate: 'CVK-2020',
      yearModel: '2020/2020',
      odometerKm: 45720,
      engineSpecs: '2.0 i-VTEC Flex (155 cv) • Câmbio CVT 7S',
      recommendedOil: '0W20 Sintético API SN (3.7L)',
      tireSpecs: '215/50 R17 (32 PSI)',
      fuelType: 'flex',
      color: 'Cinza Barium',
      isMain: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'veh_onix',
      name: 'Chevrolet Onix 1.0 LT (2018)',
      plate: 'ONX-2018',
      yearModel: '2017/2018',
      odometerKm: 62400,
      engineSpecs: '1.0 SPE/4 Eco (80 cv) • Câmbio 6M',
      recommendedOil: '5W30 Dexos1 Gen2 (3.5L)',
      tireSpecs: '185/65 R15 (35 PSI)',
      fuelType: 'flex',
      color: 'Preto Ouro Negro',
      isMain: false,
      createdAt: new Date().toISOString(),
    },
  ];
  await db.vehicles.bulkAdd(testVehicles);

  const testVehicleRecords: VehicleRecord[] = [
    { id: 'vr_1', vehicleName: 'Honda Civic 2.0 EXL (2020)', vehicleId: 'veh_civic', type: 'refuel', date: '2026-08-20', odometerKm: 45720, totalCost: 231.00, liters: 42.0, pricePerLiter: 5.50, fuelType: 'gasoline', description: 'Abastecimento Posto Shell (V-Power)', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: 'vr_2', vehicleName: 'Honda Civic 2.0 EXL (2020)', vehicleId: 'veh_civic', type: 'maintenance', date: '2026-08-15', odometerKm: 45400, totalCost: 350.00, description: 'Troca de Óleo 0w20 Sintético + Filtro de Ar e Óleo', walletId: 'w1', createdAt: new Date().toISOString() },
    { id: 'vr_3', vehicleName: 'Chevrolet Onix 1.0 LT (2018)', vehicleId: 'veh_onix', type: 'refuel', date: '2026-08-12', odometerKm: 62400, totalCost: 180.00, liters: 36.0, pricePerLiter: 5.00, fuelType: 'ethanol', description: 'Abastecimento Etanol Posto BR', walletId: 'w1', createdAt: new Date().toISOString() },
  ];
  await db.vehicleRecords.bulkAdd(testVehicleRecords);

  // 7. Estoque Doméstico (Pantry)
  const testPantryItems: PantryItem[] = [
    { id: 'pi_1', name: 'Leite Integral 1L', category: 'Laticínios', unit: 'L', idealQuantity: 12, currentQuantity: 3, lastPrice: 5.50, createdAt: new Date().toISOString() },
    { id: 'pi_2', name: 'Arroz Tipo 1 (5kg)', category: 'Alimentos', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 28.90, createdAt: new Date().toISOString() },
    { id: 'pi_3', name: 'Feijão Carioca 1kg', category: 'Alimentos', unit: 'pct', idealQuantity: 4, currentQuantity: 2, lastPrice: 8.20, createdAt: new Date().toISOString() },
    { id: 'pi_4', name: 'Café Tradicional 500g', category: 'Alimentos', unit: 'pct', idealQuantity: 3, currentQuantity: 1, lastPrice: 16.50, createdAt: new Date().toISOString() },
    { id: 'pi_5', name: 'Sabão em Pó Omo 1kg', category: 'Limpeza', unit: 'cx', idealQuantity: 3, currentQuantity: 0, lastPrice: 14.90, createdAt: new Date().toISOString() },
  ];
  await db.pantryItems.bulkAdd(testPantryItems);

  console.log('✅ Banco de Dados de Testes gerado com sucesso!');
}

