import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../estado/useAppStore';
import { exportDatabaseJSON, importDatabaseJSON } from '../../servicos/backupService';
import { Download, Upload, ShieldCheck, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '../../utilidades/errorUtils';

export const BackupModal: React.FC = () => {
  const { isBackupModalOpen, setBackupModalOpen, user } = useAppStore();
  const isGuest = user?.role === 'guest';
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setFeedback(null);
      await exportDatabaseJSON();
      setFeedback({ type: 'success', message: 'Backup exportado com sucesso! Arquivo JSON salvo na sua pasta de downloads.' });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Erro desconhecido');
      setFeedback({ type: 'error', message: `Erro ao exportar backup: ${errorMsg}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: A restauração substituirá os dados atuais pelo conteúdo do backup. Deseja continuar?')) {
      e.target.value = '';
      return;
    }

    try {
      setIsImporting(true);
      setFeedback(null);
      const res = await importDatabaseJSON(file);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Erro desconhecido');
      setFeedback({ type: 'error', message: `Erro ao restaurar: ${errorMsg}` });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <Modal
      isOpen={isBackupModalOpen}
      onClose={() => setBackupModalOpen(false)}
      title="Segurança & Backup Completo de Dados"
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Banner Informativo de Segurança */}
        <div className="p-4 bg-gradient-to-r from-[#00FF88]/15 via-[#06B6D4]/10 to-[#0D1526] border border-[#00FF88]/30 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-[#00FF88] shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs text-[#94A3B8]">
            <h4 className="font-black text-[#F8FAFC] text-sm">Privacidade Total & Armazenamento Local</h4>
            <p className="mt-1">
              Todos os seus dados financeiros, contas bancárias, veículos e transações são mantidos de forma 100% segura no seu próprio dispositivo via IndexedDB. Nenhuma informação financeira é enviada para servidores externos.
            </p>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
              feedback.type === 'success'
                ? 'bg-[#00FF88]/15 border-[#00FF88]/40 text-[#00FF88]'
                : 'bg-[#FF4D6D]/15 border-[#FF4D6D]/40 text-[#FF4D6D]'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#00FF88]" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-[#FF4D6D]" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Banner de Restrição para Modo Convidado */}
        {isGuest && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                <strong>Restrição de Modo Convidado:</strong> Você está em uma sessão de demonstração. Recursos de exportação e restauração de dados reais são exclusivos para contas cadastradas.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setBackupModalOpen(false);
                useAppStore.getState().setUser(null);
                useAppStore.getState().setAuthMode('register');
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shrink-0 transition-colors"
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Opção 1: Exportar Backup em JSON */}
        <div className="p-5 bg-[#090D18] border border-[#1E293B] hover:border-[#00FF88]/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#00FF88]/15 text-[#00FF88] rounded-xl border border-[#00FF88]/30 group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#F8FAFC]">Exportar Arquivo de Backup (.json)</h4>
              <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                Baixe um arquivo seguro com todas as suas carteiras, dívidas e lançamentos.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting || isGuest}
            className="w-full sm:w-auto text-xs px-4 shrink-0 shadow-md shadow-[#00FF88]/20 disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Gerando...' : 'Exportar JSON'}</span>
          </Button>
        </div>

        {/* Opção 2: Restaurar Backup de JSON */}
        <div className="p-5 bg-[#090D18] border border-[#1E293B] hover:border-[#06B6D4]/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#06B6D4]/15 text-[#06B6D4] rounded-xl border border-[#06B6D4]/30 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#F8FAFC]">Restaurar de Arquivo de Backup</h4>
              <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                Carregue um arquivo `.nosso-bolso-backup.json` para restaurar seus dados.
              </p>
            </div>
          </div>

          {isGuest ? (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-slate-500 text-xs font-black rounded-xl cursor-not-allowed opacity-50 shrink-0"
            >
              Restrição Demo
            </button>
          ) : (
            <label className="w-full sm:w-auto px-4 py-2.5 bg-[#06B6D4] text-[#090D16] hover:bg-[#0891B2] text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-[#06B6D4]/20 shrink-0">
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{isImporting ? 'Restaurando...' : 'Carregar JSON'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </Modal>
  );
};
