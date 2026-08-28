import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { parseOFX } from '../../services/ofxParser';
import { OFXTransaction } from '../../types';
import { db } from '../../services/db';
import { formatBRL } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export const OfxImportModal: React.FC = () => {
  const { isOfxModalOpen, setOfxModalOpen } = useAppStore();
  const [parsedItems, setParsedItems] = useState<OFXTransaction[]>([]);
  const [fileName, setFileName] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const results = parseOFX(content);
        setParsedItems(results);
        setIsDone(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImportAll = async () => {
    if (parsedItems.length === 0) return;

    const wallets = await db.wallets.toArray();
    const defaultWalletId = wallets[0]?.id || 'w1';

    const transactionsToAdd = parsedItems.map((item) => ({
      id: item.id,
      description: item.description,
      amount: item.amount,
      date: item.date,
      type: item.type,
      category: item.suggestedCategory,
      walletId: defaultWalletId,
      createdAt: new Date().toISOString(),
    }));

    await db.transactions.bulkAdd(transactionsToAdd);
    setIsDone(true);

    setTimeout(() => {
      setParsedItems([]);
      setFileName('');
      setIsDone(false);
      setOfxModalOpen(false);
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOfxModalOpen}
      onClose={() => setOfxModalOpen(false)}
      title="Importar Extrato Bancário (OFX)"
    >
      <div className="flex flex-col gap-4">
        {/* Upload Zone */}
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#1E2330] hover:border-[#00FF88] rounded-2xl cursor-pointer bg-[#0A0B0E]/50 transition-colors group">
          <Upload className="w-8 h-8 text-[#64748B] group-hover:text-[#00FF88] mb-2 transition-colors" />
          <span className="text-sm font-semibold text-[#F8FAFC]">
            {fileName ? fileName : 'Clique para selecionar arquivo .ofx'}
          </span>
          <span className="text-xs text-[#64748B] mt-1">Extrato do Nubank, Itaú, Bradesco, Inter...</span>
          <input type="file" accept=".ofx,.xml" onChange={handleFileUpload} className="hidden" />
        </label>

        {isDone && (
          <div className="flex items-center gap-2 p-3 bg-[#10B981]/10 text-[#10B981] rounded-xl font-semibold text-sm">
            <CheckCircle className="w-5 h-5" />
            <span>{parsedItems.length} transações importadas com sucesso!</span>
          </div>
        )}

        {/* Parsed List Preview */}
        {!isDone && parsedItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-semibold uppercase">
              <span>{parsedItems.length} Transações Encontradas</span>
              <span>Preview</span>
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col divide-y divide-[#1E2330] bg-[#0A0B0E] rounded-xl border border-[#1E2330] p-2">
              {parsedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-2 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#06B6D4]" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#F8FAFC]">{item.description}</span>
                      <span className="text-[#64748B]">{formatDate(item.date)} • {item.suggestedCategory}</span>
                    </div>
                  </div>
                  <span className={`font-bold ${item.type === 'income' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {item.type === 'income' ? '+' : '-'} {formatBRL(item.amount)}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="primary" onClick={handleImportAll} className="mt-2">
              Confirmar Importação de {parsedItems.length} Transações
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
