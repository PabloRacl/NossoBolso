import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from '../../services/supabase';
import { Database, CheckCircle2, Copy, ExternalLink, Cloud, ShieldCheck } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="☁️ Banco de Dados Online (Supabase Cloud)">
      <div className="flex flex-col gap-5 text-sm">
        {/* Status Card */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isSupabaseConfigured
            ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
            : 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]'
        }`}>
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="font-extrabold text-base">
                {isSupabaseConfigured ? 'Supabase Conectado!' : 'Modo Offline Ativo (Pronto para Conectar)'}
              </h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {isSupabaseConfigured
                  ? 'Seus dados estão sincronizando em tempo real na nuvem Supabase.'
                  : 'Seus dados estão salvos localmente. Conecte o Supabase para ter sincronização online.'}
              </p>
            </div>
          </div>
          {isSupabaseConfigured && <ShieldCheck className="w-6 h-6 text-[#10B981]" />}
        </div>

        {/* Step-by-Step Guide */}
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-[#F8FAFC] text-base flex items-center gap-2">
            <span>🚀 Como Conectar seu Banco de Dados Gratuito</span>
          </h4>

          <ol className="flex flex-col gap-3 text-xs text-[#94A3B8] font-medium list-decimal pl-4">
            <li>
              Crie uma conta gratuita no{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#00FF88] underline font-bold inline-flex items-center gap-1"
              >
                Supabase.com <ExternalLink className="w-3 h-3" />
              </a>{' '}
              e crie um novo projeto.
            </li>
            <li>
              No painel do Supabase, vá em **SQL Editor** e cole a estrutura de tabelas abaixo:
            </li>
          </ol>

          {/* Code Box */}
          <div className="relative bg-[#0B0F19] border border-[#2E3B52] rounded-xl p-3 text-xs font-mono text-[#00FF88] overflow-x-auto max-h-40">
            <button
              onClick={handleCopySql}
              className="absolute top-2 right-2 p-1.5 bg-[#162032] hover:bg-[#1E293B] border border-[#2E3B52] rounded-lg text-[#F8FAFC] flex items-center gap-1.5 transition-colors text-[11px]"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
            <pre className="pr-20 text-[11px] leading-relaxed">{SUPABASE_SQL_SCHEMA.trim()}</pre>
          </div>

          <div className="text-xs text-[#94A3B8] font-medium mt-1">
            <span className="font-bold text-[#F8FAFC]">3. Adicione no Vercel (Environment Variables):</span>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li><code className="text-[#00FF88] bg-[#162032] px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code></li>
              <li><code className="text-[#00FF88] bg-[#162032] px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code></li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#2E3B52]">
          <Button variant="primary" onClick={onClose}>
            <Cloud className="w-4 h-4" />
            <span>Entendido!</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
