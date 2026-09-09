/**
 * Gerador seguro de identificadores únicos para entidades do NossoBolso.
 * Utiliza crypto.randomUUID() nativo com fallback determinístico caso indisponível.
 */
export function generateId(prefix: string = ''): string {
  let uuid: string;

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    uuid = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    uuid = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  return prefix ? `${prefix}_${uuid}` : uuid;
}
