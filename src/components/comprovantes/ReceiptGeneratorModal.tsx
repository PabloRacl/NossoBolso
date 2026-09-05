import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatBRL } from '../../utilidades/formatters';
import { FileText, Printer, Share2, CheckCircle2, Sparkles, QrCode } from 'lucide-react';

export const ReceiptGeneratorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [payerName, setPayerName] = useState('João da Silva');
  const [amount, setAmount] = useState<number>(350);
  const [description, setDescription] = useState('Serviços prestados de consultoria técnica e manutenção.');
  const [city, setCity] = useState('Recife - PE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = `RECIBO DE PAGAMENTO - NOSSOBOLSO
-----------------------------------
Recebi de: ${payerName}
A quantia de: R$ ${amount.toFixed(2)}
Referente a: ${description}
Local e Data: ${city}, ${date}

Comprovante gerado com sucesso via NossoBolso Finance OS.`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerador de Recibos & Comprovantes Profissionais">
      <div className="flex flex-col gap-6 py-2">
        {/* Formulário do Recibo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Recebi de (Nome do Pagador):</label>
            <input
              type="text"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#94A3B8]">Valor (R$):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-[#94A3B8]">Referente a (Descrição):</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 bg-[#090D18] border border-[#2E3B52] rounded-xl text-xs font-bold text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none"
            />
          </div>
        </div>

        {/* Pré-visualização do Recibo Formatado */}
        <div className="p-6 bg-[#FFFFFF] text-[#090D16] rounded-2xl flex flex-col gap-4 border border-[#CBD5E1] shadow-xl font-sans">
          <div className="flex items-center justify-between border-b-2 border-[#090D16] pb-3">
            <h3 className="text-lg font-black uppercase tracking-widest text-[#090D16]">RECIBO DE PAGAMENTO</h3>
            <span className="text-xl font-black text-[#00AA55] bg-[#E6F9F0] px-3 py-1 rounded-lg border border-[#00AA55]/30">
              R$ {amount.toFixed(2)}
            </span>
          </div>

          <p className="text-sm leading-relaxed font-medium">
            Recebi(emos) de <strong className="font-black text-[#090D16]">{payerName}</strong> a importância de{' '}
            <strong className="font-black text-[#090D16]">R$ {amount.toFixed(2)}</strong> referente a {description}.
          </p>

          <div className="flex items-end justify-between pt-4 border-t border-[#E2E8F0]">
            <div className="flex flex-col text-xs font-bold text-[#64748B]">
              <span>{city}, {date}</span>
              <span className="text-[10px] text-[#94A3B8] mt-1">Autenticação Digital NossoBolso #REC-{Date.now().toString().slice(-6)}</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-32 border-b border-[#090D16] mb-1"></div>
              <span className="text-[10px] font-black uppercase text-[#090D16]">Assinatura do Emissor</span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleSendWhatsApp} className="w-full text-xs">
            <Share2 className="w-4 h-4 text-[#00FF88]" />
            <span>Enviar por WhatsApp</span>
          </Button>

          <Button variant="primary" onClick={handlePrint} className="w-full text-xs shadow-md shadow-[#00FF88]/20">
            <Printer className="w-4 h-4" />
            <span>Imprimir Recibo em PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
