import React from 'react';
import { Modal } from '../ui/Modal';
import { Keyboard, Command, Sparkles } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUT_LIST: ShortcutItem[] = [
  { keys: ['Ctrl', 'K'], description: 'Busca Rápida & Gerador de Banco de Dados de Teste', category: 'Geral' },
  { keys: ['Ctrl', '/'], description: 'Abrir esta Central de Teclas de Atalho', category: 'Geral' },
  { keys: ['M'], description: 'Assistente de Comando de Voz por IA em Português 🎙️', category: 'Ações Rápidas' },
  { keys: ['Q'], description: 'Leitor Óptico de Nota Fiscal NFC-e por QRCode 🧾', category: 'Ações Rápidas' },
  { keys: ['E'], description: 'Simulador de Cenários Estratégicos "E Se?" 🔮', category: 'Simuladores' },
  { keys: ['H'], description: 'Abrir Gaveta Lateral de Histórico de Transações 📜', category: 'Navegação' },
  { keys: ['B'], description: 'Backup & Restauração Completa em JSON 💾', category: 'Segurança' },
  { keys: ['T'], description: 'Central de Temas Customizáveis (Neon) 🎨', category: 'Estilo' },
  { keys: ['R'], description: 'Gerador de Recibos & Comprovantes Profissionais 🧾', category: 'Ferramentas' },
  { keys: ['P'], description: 'Alternar Modo Privacidade (Ocultar/Mostrar Valores) 👁️', category: 'Privacidade' },
];

export const ShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Central de Teclas de Atalho Globais">
      <div className="flex flex-col gap-6 py-2">
        {/* Banner de Cabeçalho */}
        <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/10 to-[#0D1526] border border-[#00FF88]/30 rounded-2xl flex items-start gap-3">
          <Keyboard className="w-6 h-6 text-[#00FF88] shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Produtividade de Alta Performance</h4>
            <p className="mt-1">
              Opere todo o NossoBolso diretamente pelo teclado sem precisar do mouse usando estes atalhos instantâneos!
            </p>
          </div>
        </div>

        {/* Lista de Atalhos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHORTCUT_LIST.map((item, idx) => (
            <div key={idx} className="p-3 bg-[#090D18] border border-[#1E293B] hover:border-[#00FF88]/40 rounded-xl flex items-center justify-between transition-all">
              <span className="text-xs font-semibold text-[#F8FAFC]">{item.description}</span>

              <div className="flex items-center gap-1 shrink-0">
                {item.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-1 bg-[#121929] border border-[#2E3B52] rounded-md text-[10px] font-black text-[#00FF88] shadow-sm uppercase font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
