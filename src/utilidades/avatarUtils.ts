/**
 * Utilitários para Geração Segura e Anônima de Avatares
 * Previne vazamento de PII (Personally Identifiable Information) como e-mails e nomes completos
 * em serviços externos de terceiros (como DiceBear).
 */

/**
 * Gera uma semente determinística anônima a partir de uma string (sem expor o texto original).
 */
export function getAnonymousAvatarSeed(identifier: string): string {
  if (!identifier) return 'user_avatar_default';

  // Algoritmo de dispersão determinístico (DJB2 invertido) que gera um hash hexadecimal opaco
  let hash = 5381;
  const str = identifier.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Converte para inteiro de 32 bits
  }

  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `avatar_${hexHash}`;
}

/**
 * Retorna uma URL segura de avatar do DiceBear com semente totalmente anônima.
 */
export function getSafeDicebearAvatar(identifier: string): string {
  const safeSeed = getAnonymousAvatarSeed(identifier);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${safeSeed}`;
}
