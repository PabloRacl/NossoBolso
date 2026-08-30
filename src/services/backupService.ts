import { db } from './db';
import { Transaction, Wallet, Category, Goal, DebtContract, Budget, RecurringTransaction, PantryItem, VehicleRecord, Vehicle } from '../types';

export interface BackupPayload {
  version: string;
  exportDate: string;
  data: {
    transactions: Transaction[];
    wallets: Wallet[];
    categories: Category[];
    goals: Goal[];
    debtContracts: DebtContract[];
    budgets: Budget[];
    recurringTransactions: RecurringTransaction[];
    pantryItems: PantryItem[];
    vehicleRecords: VehicleRecord[];
    vehicles: Vehicle[];
  };
}

export async function exportDatabaseJSON(): Promise<void> {
  const transactions = await db.transactions.toArray();
  const wallets = await db.wallets.toArray();
  const categories = await db.categories.toArray();
  const goals = await db.goals.toArray();
  const debtContracts = await db.debtContracts.toArray();
  const budgets = await db.budgets.toArray();
  const recurringTransactions = await db.recurringTransactions.toArray();
  const pantryItems = await db.pantryItems.toArray();
  const vehicleRecords = await db.vehicleRecords.toArray();
  const vehicles = await db.vehicles.toArray();

  const backupData: BackupPayload = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    data: {
      transactions,
      wallets,
      categories,
      goals,
      debtContracts,
      budgets,
      recurringTransactions,
      pantryItems,
      vehicleRecords,
      vehicles,
    },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const todayStr = new Date().toISOString().split('T')[0];
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `nosso-bolso-backup-${todayStr}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

export async function importDatabaseJSON(file: File): Promise<{ success: boolean; message: string; count: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          resolve({ success: false, message: 'Arquivo vazio.', count: 0 });
          return;
        }

        const payload: BackupPayload = JSON.parse(text);
        if (!payload.data || typeof payload.data !== 'object' || !Array.isArray(payload.data.transactions)) {
          resolve({ success: false, message: 'Formato de arquivo de backup inválido.', count: 0 });
          return;
        }

        const { data } = payload;

        // Transactional clear & re-population
        await db.transaction('rw', [
          db.transactions,
          db.wallets,
          db.categories,
          db.goals,
          db.debtContracts,
          db.budgets,
          db.recurringTransactions,
          db.pantryItems,
          db.vehicleRecords,
          db.vehicles,
        ], async () => {
          await db.transactions.clear();
          await db.wallets.clear();
          await db.categories.clear();
          await db.goals.clear();
          await db.debtContracts.clear();
          await db.budgets.clear();
          await db.recurringTransactions.clear();
          await db.pantryItems.clear();
          await db.vehicleRecords.clear();
          await db.vehicles.clear();

          if (data.wallets?.length) await db.wallets.bulkAdd(data.wallets);
          if (data.categories?.length) await db.categories.bulkAdd(data.categories);
          if (data.transactions?.length) await db.transactions.bulkAdd(data.transactions);
          if (data.goals?.length) await db.goals.bulkAdd(data.goals);
          if (data.debtContracts?.length) await db.debtContracts.bulkAdd(data.debtContracts);
          if (data.budgets?.length) await db.budgets.bulkAdd(data.budgets);
          if (data.recurringTransactions?.length) await db.recurringTransactions.bulkAdd(data.recurringTransactions);
          if (data.pantryItems?.length) await db.pantryItems.bulkAdd(data.pantryItems);
          if (data.vehicleRecords?.length) await db.vehicleRecords.bulkAdd(data.vehicleRecords);
          if (data.vehicles?.length) await db.vehicles.bulkAdd(data.vehicles);
        });

        const totalItems = (data.transactions?.length || 0) + (data.wallets?.length || 0);
        resolve({
          success: true,
          message: `Restauração concluída com sucesso! ${totalItems} registros importados.`,
          count: totalItems,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('Erro na importação do backup:', err);
        resolve({ success: false, message: `Falha ao processar backup: ${errorMsg}`, count: 0 });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: 'Erro ao ler arquivo do disco.', count: 0 });
    };

    reader.readAsText(file);
  });
}
