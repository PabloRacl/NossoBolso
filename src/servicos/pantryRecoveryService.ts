import { db, getActiveDb, NossoBolsoDB } from './db';
import { PantryItem } from '../tipos';

export interface RecoveryResult {
  success: boolean;
  restoredCount: number;
  sourceDb?: string;
  message: string;
  foundDatabases: string[];
}

// Lista canônica de estoques conhecidos e bancos legados
const KNOWN_LEGACY_DBS = [
  'nosso-bolso-db',
  'nosso-bolso-guest-demo',
  'nosso-bolso-user_usr_default_01',
  'nosso-bolso-user_usr_guest',
];

/**
 * Varre todos os bancos IndexedDB do navegador à procura de tabelas 'pantryItems'
 * com registros para restaurar no banco de dados ativo.
 */
export async function recoverPantryFromAnyDatabase(): Promise<RecoveryResult> {
  const activeDatabase = getActiveDb();
  const currentDbName = activeDatabase.name;
  const dbNamesToScan = new Set<string>(KNOWN_LEGACY_DBS);

  // Se o navegador suportar indexedDB.databases(), adiciona todos os bancos que contenham 'nosso-bolso'
  if (typeof window !== 'undefined' && 'indexedDB' in window && 'databases' in window.indexedDB) {
    try {
      const existingDbs = await window.indexedDB.databases();
      for (const d of existingDbs) {
        if (d.name && d.name.includes('nosso-bolso')) {
          dbNamesToScan.add(d.name);
        }
      }
    } catch (e) {
      console.warn('Não foi possível listar databases via indexedDB.databases():', e);
    }
  }

  // Remove o banco ativo da lista de fontes de recuperação para não duplicar consigo mesmo
  dbNamesToScan.delete(currentDbName);

  let totalRestored = 0;
  let sourceDbFound = '';
  const scannedDbs: string[] = [];

  for (const candidateName of dbNamesToScan) {
    scannedDbs.push(candidateName);
    try {
      const candidateItems = await readPantryItemsFromDb(candidateName);
      if (candidateItems.length > 0) {
        // Encontrou itens no banco candidato! Mescla com o banco ativo
        for (const item of candidateItems) {
          const exists = await activeDatabase.pantryItems.get(item.id);
          if (!exists) {
            await activeDatabase.pantryItems.add(item);
            totalRestored++;
          }
        }

        if (totalRestored > 0) {
          sourceDbFound = candidateName;
          break; // Recuperou do banco que continha os dados
        }
      }
    } catch (err) {
      // Banco não existe ou não tem a store pantryItems, continua para o próximo
      console.warn(`Tentativa de leitura em ${candidateName} ignorada:`, err);
    }
  }

  if (totalRestored > 0) {
    return {
      success: true,
      restoredCount: totalRestored,
      sourceDb: sourceDbFound,
      message: `🎉 Sucesso! ${totalRestored} itens de estoque foram recuperados do banco legado "${sourceDbFound}".`,
      foundDatabases: scannedDbs,
    };
  }

  return {
    success: false,
    restoredCount: 0,
    message: 'Nenhum item de estoque foi localizado nos bancos legados do navegador.',
    foundDatabases: scannedDbs,
  };
}

/**
 * Lê diretamente os itens de pantry de um banco específico via IndexedDB nativo
 * para evitar conflitos de schema do Dexie.
 */
function readPantryItemsFromDb(dbName: string): Promise<PantryItem[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve([]);
      return;
    }

    const request = window.indexedDB.open(dbName);

    request.onerror = () => {
      resolve([]);
    };

    request.onsuccess = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains('pantryItems')) {
        idb.close();
        resolve([]);
        return;
      }

      try {
        const tx = idb.transaction('pantryItems', 'readonly');
        const store = tx.objectStore('pantryItems');
        const getAllReq = store.getAll();

        getAllReq.onsuccess = () => {
          const results = getAllReq.result as PantryItem[];
          idb.close();
          resolve(Array.isArray(results) ? results : []);
        };

        getAllReq.onerror = () => {
          idb.close();
          resolve([]);
        };
      } catch {
        idb.close();
        resolve([]);
      }
    };
  });
}

/**
 * Catálogo residencial completo da casa brasileira (+45 itens essenciais)
 * Permite restaurar instantaneamente a despensa completa caso o banco anterior tenha sido limpo.
 */
export const COMPREHENSIVE_PANTRY_CATALOG: Omit<PantryItem, 'id' | 'createdAt'>[] = [
  // Alimentos Básicos & Mercearia
  { name: 'Arroz Tipo 1 (5kg)', category: 'Alimentos', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 28.90 },
  { name: 'Feijão Carioca (1kg)', category: 'Alimentos', unit: 'pct', idealQuantity: 4, currentQuantity: 2, lastPrice: 8.50 },
  { name: 'Feijão Preto (1kg)', category: 'Alimentos', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 8.90 },
  { name: 'Macarrão Espaguete (500g)', category: 'Alimentos', unit: 'pct', idealQuantity: 4, currentQuantity: 2, lastPrice: 4.50 },
  { name: 'Macarrão Parafuso (500g)', category: 'Alimentos', unit: 'pct', idealQuantity: 3, currentQuantity: 1, lastPrice: 4.80 },
  { name: 'Molho de Tomate Tradicional (340g)', category: 'Alimentos', unit: 'un', idealQuantity: 6, currentQuantity: 3, lastPrice: 2.90 },
  { name: 'Óleo de Soja (900ml)', category: 'Alimentos', unit: 'un', idealQuantity: 4, currentQuantity: 2, lastPrice: 6.90 },
  { name: 'Azeite de Oliva Extra Virgem (500ml)', category: 'Alimentos', unit: 'un', idealQuantity: 2, currentQuantity: 1, lastPrice: 38.90 },
  { name: 'Açúcar Refinado (1kg)', category: 'Alimentos', unit: 'pct', idealQuantity: 4, currentQuantity: 2, lastPrice: 4.60 },
  { name: 'Sal Refinado Iodado (1kg)', category: 'Alimentos', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 2.50 },
  { name: 'Café Torrado e Moído (500g)', category: 'Alimentos', unit: 'pct', idealQuantity: 4, currentQuantity: 2, lastPrice: 18.90 },
  { name: 'Farinha de Trigo Tradicional (1kg)', category: 'Alimentos', unit: 'pct', idealQuantity: 3, currentQuantity: 1, lastPrice: 5.20 },
  { name: 'Flocão de Milho / Cuscuz (500g)', category: 'Alimentos', unit: 'pct', idealQuantity: 4, currentQuantity: 2, lastPrice: 2.80 },
  { name: 'Aveia em Flocos Finos (500g)', category: 'Alimentos', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 6.50 },
  { name: 'Milho Verde em Conserva (170g)', category: 'Alimentos', unit: 'un', idealQuantity: 4, currentQuantity: 2, lastPrice: 3.50 },

  // Laticínios & Frios
  { name: 'Leite Integral UHT (1L)', category: 'Laticínios', unit: 'L', idealQuantity: 12, currentQuantity: 4, lastPrice: 5.40 },
  { name: 'Leite Condensado (395g)', category: 'Laticínios', unit: 'un', idealQuantity: 3, currentQuantity: 1, lastPrice: 5.90 },
  { name: 'Creme de Leite (200g)', category: 'Laticínios', unit: 'un', idealQuantity: 4, currentQuantity: 2, lastPrice: 3.20 },
  { name: 'Manteiga com Sal (200g)', category: 'Laticínios', unit: 'un', idealQuantity: 2, currentQuantity: 1, lastPrice: 12.90 },
  { name: 'Queijo Mussarela Fatiado (500g)', category: 'Laticínios', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 24.50 },
  { name: 'Presunto Cozido Fatiado (300g)', category: 'Laticínios', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 13.90 },
  { name: 'Requeijão Cremoso Tradicional (200g)', category: 'Laticínios', unit: 'un', idealQuantity: 2, currentQuantity: 1, lastPrice: 8.90 },

  // Carnes, Proteínas & Ovos
  { name: 'Ovos Brancos Especiais (Cartela c/ 30)', category: 'Carnes & Peixes', unit: 'cx', idealQuantity: 2, currentQuantity: 1, lastPrice: 21.90 },
  { name: 'Peito de Frango Congelado (1kg)', category: 'Carnes & Peixes', unit: 'kg', idealQuantity: 4, currentQuantity: 2, lastPrice: 19.90 },
  { name: 'Carne Moída Patinho (1kg)', category: 'Carnes & Peixes', unit: 'kg', idealQuantity: 3, currentQuantity: 1, lastPrice: 36.90 },
  { name: 'Filé de Tilápia Congelado (800g)', category: 'Carnes & Peixes', unit: 'pct', idealQuantity: 2, currentQuantity: 0, lastPrice: 39.90 },

  // Hortifrúti Fresco
  { name: 'Cebola Nacional (1kg)', category: 'Hortifrúti', unit: 'kg', idealQuantity: 3, currentQuantity: 1, lastPrice: 6.90 },
  { name: 'Alho Roxo (200g)', category: 'Hortifrúti', unit: 'pct', idealQuantity: 3, currentQuantity: 1, lastPrice: 7.90 },
  { name: 'Batata Inglesa Lavada (1kg)', category: 'Hortifrúti', unit: 'kg', idealQuantity: 3, currentQuantity: 1, lastPrice: 7.50 },
  { name: 'Cenoura Especial (1kg)', category: 'Hortifrúti', unit: 'kg', idealQuantity: 2, currentQuantity: 1, lastPrice: 6.20 },
  { name: 'Tomate Italiano (1kg)', category: 'Hortifrúti', unit: 'kg', idealQuantity: 3, currentQuantity: 1, lastPrice: 8.90 },
  { name: 'Banana Prata (1kg)', category: 'Hortifrúti', unit: 'kg', idealQuantity: 2, currentQuantity: 1, lastPrice: 6.90 },
  { name: 'Maçã Nacional Fuji (1kg)', category: 'Hortifrúti', unit: 'kg', idealQuantity: 2, currentQuantity: 1, lastPrice: 10.90 },
  { name: 'Limão Tahiti (1kg)', category: 'Hortifrúti', unit: 'kg', idealQuantity: 2, currentQuantity: 1, lastPrice: 5.50 },

  // Limpeza da Casa
  { name: 'Detergente Líquido Lava-Louças (500ml)', category: 'Limpeza', unit: 'un', idealQuantity: 6, currentQuantity: 2, lastPrice: 2.60 },
  { name: 'Sabão em Pó Lava Roupas (1.6kg)', category: 'Limpeza', unit: 'cx', idealQuantity: 2, currentQuantity: 1, lastPrice: 22.90 },
  { name: 'Amaciante Concentrado para Roupas (1L)', category: 'Limpeza', unit: 'un', idealQuantity: 2, currentQuantity: 1, lastPrice: 16.90 },
  { name: 'Água Sanitária Cloro Ativo (2L)', category: 'Limpeza', unit: 'un', idealQuantity: 3, currentQuantity: 1, lastPrice: 6.90 },
  { name: 'Desinfetante Multiuso Perfumado (1L)', category: 'Limpeza', unit: 'un', idealQuantity: 3, currentQuantity: 1, lastPrice: 7.90 },
  { name: 'Esponja de Cozinha Dupla Face (Pct c/ 4)', category: 'Limpeza', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 5.80 },
  { name: 'Sacos de Lixo Reforçados 50L (Rolo c/ 30)', category: 'Limpeza', unit: 'pct', idealQuantity: 2, currentQuantity: 1, lastPrice: 14.50 },
  { name: 'Papel Toalha de Cozinha (Pct c/ 2 rolos)', category: 'Limpeza', unit: 'pct', idealQuantity: 3, currentQuantity: 1, lastPrice: 6.50 },

  // Higiene & Cuidados Pessoais
  { name: 'Papel Higiênico Folha Dupla (Pct c/ 12 rolos)', category: 'Higiene', unit: 'pct', idealQuantity: 3, currentQuantity: 1, lastPrice: 22.90 },
  { name: 'Sabonete em Barra Hidratante (90g)', category: 'Higiene', unit: 'un', idealQuantity: 8, currentQuantity: 3, lastPrice: 3.20 },
  { name: 'Creme Dental com Flúor (90g)', category: 'Higiene', unit: 'un', idealQuantity: 4, currentQuantity: 2, lastPrice: 4.90 },
  { name: 'Shampoo Anticaspa / Nutritivo (400ml)', category: 'Higiene', unit: 'un', idealQuantity: 2, currentQuantity: 1, lastPrice: 19.90 },
  { name: 'Condicionador Hidratante (400ml)', category: 'Higiene', unit: 'un', idealQuantity: 2, currentQuantity: 1, lastPrice: 21.90 },
  { name: 'Desodorante Antitranspirante Aerosol (150ml)', category: 'Higiene', unit: 'un', idealQuantity: 3, currentQuantity: 1, lastPrice: 14.90 },
];

/**
 * Restaura o catálogo residencial completo de itens na despensa ativa
 */
export async function seedComprehensivePantryCatalog(): Promise<number> {
  const activeDatabase = getActiveDb();
  let addedCount = 0;

  for (const item of COMPREHENSIVE_PANTRY_CATALOG) {
    const existing = await activeDatabase.pantryItems
      .filter((i) => i.name.toLowerCase() === item.name.toLowerCase())
      .first();

    if (!existing) {
      await activeDatabase.pantryItems.add({
        ...item,
        id: `pi_cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      });
      addedCount++;
    }
  }

  return addedCount;
}
