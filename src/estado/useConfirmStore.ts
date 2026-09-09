import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolvePromise: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

const defaultOptions: ConfirmOptions = {
  title: 'Confirmação',
  message: 'Deseja realmente prosseguir com esta ação?',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'danger',
};

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: defaultOptions,
  resolvePromise: null,

  confirm: (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        options: {
          ...defaultOptions,
          ...options,
        },
        resolvePromise: resolve,
      });
    });
  },

  handleConfirm: () => {
    const { resolvePromise } = get();
    if (resolvePromise) {
      resolvePromise(true);
    }
    set({ isOpen: false, resolvePromise: null });
  },

  handleCancel: () => {
    const { resolvePromise } = get();
    if (resolvePromise) {
      resolvePromise(false);
    }
    set({ isOpen: false, resolvePromise: null });
  },
}));

/**
 * Hook para invocar diálogos de confirmação customizados e acessíveis.
 */
export const useConfirm = () => {
  return useConfirmStore((state) => state.confirm);
};

/**
 * Hook para disparar alertas visuais padronizados (sem travar a thread).
 */
export const useAlert = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  return (title: string, message: string, variant: 'info' | 'warning' | 'danger' = 'info') => {
    return confirm({
      title,
      message,
      confirmText: 'Entendido',
      cancelText: '',
      variant,
    });
  };
};
