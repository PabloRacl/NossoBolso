import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  recoverPantryFromAnyDatabase,
  seedComprehensivePantryCatalog,
  RecoveryResult,
} from '../../servicos/pantryRecoveryService';
import {
  RotateCcw,
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PackageCheck,
  Search,
} from 'lucide-react';

interface PantryRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCurrentItems: number;
}

export const PantryRestoreModal: React.FC<PantryRestoreModalProps> = ({
  isOpen,
  onClose,
  totalCurrentItems,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const [catalogAddedCount, setCatalogAddedCount] = useState<number | null>(null);

  const handleScanLegacyDatabases = async () => {
    setIsLoading(true);
    setResult(null);
    setCatalogAddedCount(null);
    try {
      const res = await recoverPantryFromAnyDatabase();
      setResult(res);
    } catch (err) {
      console.error('Erro na varredura de bancos:', err);
      setResult({
        success: false,
        restoredCount: 0,
        message: 'Ocorreu uma falha ao acessar os bancos legados do navegador.',
        foundDatabases: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedCompleteCatalog = async () => {
    setIsLoading(true);
    setResult(null);
    setCatalogAddedCount(null);
    try {
      const count = await seedComprehensivePantryCatalog();
      setCatalogAddedCount(count);
    } catch (err) {
      console.error('Erro ao restaurar catálogo completo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recuperação & Restauração de Estoque"
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5 p-1">
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Se você preencheu seu estoque anteriormente e os itens sumiram após uma atualização do sistema
          ou troca de usuário/visitante, use as opções abaixo para resgatar os dados do navegador ou restaurar o estoque doméstico completo.
        </p>

        {/* Feedback das Ações */}
        {result && (
          <div
            className={`p-4 rounded-xl border text-xs flex flex-col gap-2 ${
              result.success
                ? 'bg-[#00FF88]/10 border-[#00FF88]/30 text-[#F8FAFC]'
                : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-[#00FF88] shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#F59E0B] shrink-0" />
              )}
              <span className="font-bold">{result.message}</span>
            </div>

            {result.foundDatabases.length > 0 && (
              <div className="text-[11px] text-[#94A3B8] pl-7">
                Bancos de dados verificados: <code className="text-[#06B6D4]">{result.foundDatabases.join(', ')}</code>
              </div>
            )}
          </div>
        )}

        {catalogAddedCount !== null && (
          <div className="p-4 rounded-xl border bg-[#00FF88]/10 border-[#00FF88]/30 text-xs text-[#F8FAFC] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00FF88] shrink-0" />
            <span>
              {catalogAddedCount > 0
                ? `🎉 Catálogo aplicado com sucesso! ${catalogAddedCount} novos itens essenciais foram inseridos no seu estoque.`
                : 'Todos os itens essenciais do catálogo já estavam presentes no seu estoque!'}
            </span>
          </div>
        )}

        {/* Opção 1: Varredura de Bancos Anteriores */}
        <Card className="p-4 flex flex-col gap-3 bg-[#0A0B0E]/80 border-[#2E3B52] hover:border-[#06B6D4]/40 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#06B6D4]/20 text-[#06B6D4] rounded-xl border border-[#06B6D4]/30 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#F8FAFC]">1. Buscar em Bancos de Dados Anteriores</h4>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Procura tabelas de estoque em versões antigas do banco local IndexedDB (<code className="text-[#06B6D4]">nosso-bolso-db</code>, contas de demonstração e sessões anteriores).
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleScanLegacyDatabases}
            disabled={isLoading}
            className="w-full border-[#06B6D4]/40 text-[#06B6D4] hover:bg-[#06B6D4]/15 font-bold"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Varre e Resgatar do Banco Local</span>
          </Button>
        </Card>

        {/* Opção 2: Restauração do Catálogo Doméstico Completo */}
        <Card className="p-4 flex flex-col gap-3 bg-[#0A0B0E]/80 border-[#2E3B52] hover:border-[#00FF88]/40 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#00FF88]/20 text-[#00FF88] rounded-xl border border-[#00FF88]/30 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#F8FAFC]">2. Restaurar Despensa Completa (+45 Itens)</h4>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Se os dados foram limpos pelo navegador, preencha automaticamente o estoque com mais de 45 itens essenciais da casa brasileira (arroz, feijão, carnes, laticínios, limpeza e higiene) já categorizados.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSeedCompleteCatalog}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#00FF88] to-[#06B6D4] text-[#0A0B0E] font-black"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PackageCheck className="w-4 h-4" />
            )}
            <span>Carregar Despensa Residencial Completa</span>
          </Button>
        </Card>

        <div className="flex items-center justify-between pt-2 border-t border-[#2E3B52] text-xs text-[#94A3B8]">
          <span>Estoque atual: <strong>{totalCurrentItems} itens</strong></span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
