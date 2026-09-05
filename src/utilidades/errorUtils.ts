/**
 * Utilitário de tratamento estrito de erros com type narrowing seguro (sem 'any').
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'Ocorreu um erro inesperado.'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.message === 'string' && errObj.message.trim().length > 0) {
      return errObj.message;
    }
    if (typeof errObj.text === 'string' && errObj.text.trim().length > 0) {
      return errObj.text;
    }
    if (typeof errObj.error === 'string' && errObj.error.trim().length > 0) {
      return errObj.error;
    }
  }
  return fallbackMessage;
}
