import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../estado/useAppStore';
import { db } from '../../servicos/db';
import { QrCode, Camera, Upload, CheckCircle2, Sparkles, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export const QrCodeScannerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { triggerTransactionAnimation, setTransactionModalOpen, setEditingTransactionId } = useAppStore();
  const [scannedData, setScannedData] = useState<{ merchant: string; amount: number; date: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulateScan = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setScannedData({
        merchant: 'Carrefour Supermercados NFC-e #48192',
        amount: 248.90,
        date: new Date().toISOString().split('T')[0],
      });
      setIsProcessing(false);
    }, 1200);
  };

  const handleConfirmImport = async () => {
    if (!scannedData) return;

    const wallets = await db.wallets.toArray();
    const targetWalletId = wallets[0]?.id || 'w1';

    await db.transactions.add({
      id: `tx_nfce_${Date.now()}`,
      description: scannedData.merchant,
      amount: scannedData.amount,
      date: scannedData.date,
      type: 'expense',
      category: 'Alimentação & Mercado',
      walletId: targetWalletId,
      createdAt: new Date().toISOString(),
    });

    if (wallets[0]) {
      await db.wallets.update(targetWalletId, { balance: wallets[0].balance - scannedData.amount });
    }

    triggerTransactionAnimation('expense', scannedData.amount, scannedData.merchant);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leitor de Nota Fiscal Eletrônica (NFC-e / QRCode)">
      <div className="flex flex-col gap-6 py-2">
        {/* Banner de Apresentação */}
        <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/10 to-[#0D1526] border border-[#00FF88]/30 rounded-2xl flex items-start gap-3">
          <QrCode className="w-6 h-6 text-[#00FF88] shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Leitura Óptica de Notas Fiscais</h4>
            <p className="mt-1">
              Aponte a câmera ou faça o upload da imagem do QRCode do comprovante de supermercado/farmácia para importar o valor e comerciante automaticamente.
            </p>
          </div>
        </div>

        {/* Zona de Leitura / Câmera */}
        {!scannedData ? (
          <div className="p-8 border-2 border-dashed border-[#2E3B52] hover:border-[#00FF88] rounded-2xl flex flex-col items-center justify-center gap-4 bg-[#090D18]/60 transition-all text-center">
            <div className="p-4 rounded-full bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30">
              <Camera className="w-8 h-8 animate-pulse" />
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-black text-[#F8FAFC]">Escanear Nota Fiscal por QRCode</h4>
              <p className="text-xs text-[#94A3B8]">
                Posicione o código de barras da nota em frente à câmera ou selecione um arquivo de imagem.
              </p>
            </div>

            <Button variant="primary" onClick={handleSimulateScan} disabled={isProcessing} className="text-xs px-6 shadow-md shadow-[#00FF88]/20">
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Lendo QRCode...' : 'Simular Leitura de QRCode NFC-e'}</span>
            </Button>
          </div>
        ) : (
          <div className="p-5 bg-[#090D18] border border-[#00FF88]/40 shadow-[0_0_20px_rgba(0,255,136,0.15)] rounded-2xl flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <span className="text-xs font-black text-[#00FF88] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                Nota Fiscal NFC-e Decodificada
              </span>
              <span className="text-[10px] font-bold text-[#94A3B8]">{scannedData.date}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#94A3B8]">Estabalecimento / Comerciante:</span>
              <h4 className="text-base font-black text-[#F8FAFC]">{scannedData.merchant}</h4>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#121929] border border-[#2E3B52] rounded-xl text-xs">
              <span className="text-[#94A3B8]">Valor Total da Nota:</span>
              <strong className="text-lg font-black text-[#FF4D6D]">R$ {scannedData.amount.toFixed(2)}</strong>
            </div>

            <Button variant="primary" onClick={handleConfirmImport} className="w-full text-xs shadow-md shadow-[#00FF88]/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Lançamento no Sistema</span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
