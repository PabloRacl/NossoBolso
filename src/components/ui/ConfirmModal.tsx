import React, { useEffect, useRef } from 'react';
import { useConfirmStore } from '../../estado/useConfirmStore';
import { Button } from './Button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { isOpen, options, handleConfirm, handleCancel } = useConfirmStore();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Foca automaticamente no botão de confirmação para acessibilidade
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (options.variant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-[#EF4444]" />,
          iconBg: 'bg-[#EF4444]/15 border-[#EF4444]/30 shadow-red-950/40',
          btnVariant: 'danger' as const,
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />,
          iconBg: 'bg-[#F59E0B]/15 border-[#F59E0B]/30 shadow-amber-950/40',
          btnVariant: 'primary' as const,
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-[#06B6D4]" />,
          iconBg: 'bg-[#06B6D4]/15 border-[#06B6D4]/30 shadow-cyan-950/40',
          btnVariant: 'primary' as const,
        };
    }
  };

  const { icon, iconBg, btnVariant } = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-[#0F172A] border border-[#334155]/80 rounded-2xl p-6 shadow-2xl shadow-black/80 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-lg ${iconBg}`}>
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-base font-bold text-white tracking-wide">
              {options.title}
            </h3>
            <p id="confirm-dialog-description" className="text-xs text-[#94A3B8] leading-relaxed mt-1">
              {options.message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
          {options.cancelText !== '' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-4 py-2 text-xs"
            >
              {options.cancelText || 'Cancelar'}
            </Button>
          )}

          <Button
            autoFocus
            type="button"
            variant={btnVariant}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold"
          >
            {options.confirmText || 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  );
};
