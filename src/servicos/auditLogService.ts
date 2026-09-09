/**
 * Serviço de Log de Auditoria para ações sensíveis do NossoBolso Finance OS.
 * Registra eventos como: restauração de backup, exclusão de conta, deleção de carteiras, redefinição de dados.
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'backup_restore' | 'backup_export' | 'wallet_delete' | 'wallet_transfer' | 'account_delete' | 'database_reset' | 'security_event';
  description: string;
  details?: Record<string, unknown>;
}

const STORAGE_KEY_AUDIT_LOGS = 'nossobolso_audit_logs';
const MAX_LOGS = 200;

export const auditLogService = {
  log(action: AuditLogEntry['action'], description: string, details?: Record<string, unknown>): void {
    try {
      const logs = this.getLogs();
      const newEntry: AuditLogEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        action,
        description,
        details,
      };

      logs.unshift(newEntry);
      if (logs.length > MAX_LOGS) {
        logs.length = MAX_LOGS;
      }

      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs));
    } catch (err) {
      console.warn('Falha ao registrar log de auditoria:', err);
    }
  },

  getLogs(): AuditLogEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  clearLogs(): void {
    localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
  },
};
