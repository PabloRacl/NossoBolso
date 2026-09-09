import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Download, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  exportError: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    exportError: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, exportError: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary capturou uma falha de renderização:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleEmergencyExport = (): void => {
    try {
      // Lista de chaves restritas para não expor credenciais ou tokens em dumps de resgate
      const SENSITIVE_KEYS = new Set([
        'nossobolso_registered_users',
        'nossobolso_auth_user',
        'nossobolso_auth_token',
        'nossobolso_users_db',
        'nossobolso_oauth_state',
      ]);

      const dump: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nossobolso_') && !SENSITIVE_KEYS.has(key)) {
          const val = localStorage.getItem(key) || '';
          try {
            dump[key] = JSON.parse(val);
          } catch {
            dump[key] = val;
          }
        }
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nossobolso_resgate_emergencia_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.setState({ exportError: null });
    } catch {
      this.setState({ exportError: 'Não foi possível gerar o arquivo de emergência neste dispositivo.' });
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#05070E] flex flex-col items-center justify-center p-6 text-[#F8FAFC]">
          <div className="max-w-lg w-full p-6 bg-[#090D18] border border-[#FF4D6D]/40 rounded-2xl shadow-[0_0_40px_rgba(255,77,109,0.15)] flex flex-col items-center text-center gap-5">
            <div className="p-4 bg-[#FF4D6D]/20 text-[#FF4D6D] rounded-2xl border border-[#FF4D6D]/40 shadow-lg">
              <AlertOctagon className="w-10 h-10 animate-pulse" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-black text-[#F8FAFC]">
                {this.props.fallbackTitle || 'Ops! Algo inesperado aconteceu.'}
              </h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                O NossoBolso isolou uma falha de renderização para proteger a integridade dos seus dados contábeis.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full p-3 bg-[#0A0B0E] border border-[#1E293B] rounded-xl text-left">
                <span className="text-[10px] font-black uppercase text-[#FF4D6D] block mb-1">
                  Detalhes Técnicos:
                </span>
                <code className="text-xs text-[#94A3B8] font-mono break-all line-clamp-3">
                  {this.state.error.message}
                </code>
              </div>
            )}

            {this.state.exportError && (
              <div className="w-full p-3 bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 rounded-xl text-xs text-[#FF4D6D]">
                {this.state.exportError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
              <Button
                variant="primary"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recarregar Aplicação</span>
              </Button>

              <Button
                variant="outline"
                onClick={this.handleEmergencyExport}
                className="w-full flex items-center justify-center gap-2 border-[#00FF88]/40 text-[#00FF88] hover:bg-[#00FF88]/10"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Resgate</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
