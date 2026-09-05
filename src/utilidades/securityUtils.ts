/**
 * Utilitários de Segurança do NossoBolso Finance OS
 * Implementa Criptografia via Web Crypto API nativa e proteção de Rate Limiting.
 */

const SALT_PEPPER = 'NossoBolso_Finance_OS_Sec_Salt_2026_v1';

/**
 * Gera um hash SHA-256 seguro a partir da senha e salt da aplicação.
 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${SALT_PEPPER}:${password.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se a senha informada corresponde ao hash SHA-256 armazenado.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;
  const computedHash = await hashPassword(password);
  return computedHash === storedHash;
}

interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}

const rateLimitStore: Record<string, RateLimitEntry> = {};

/**
 * Verifica se uma chave (ex: email ou IP) está bloqueada por excesso de tentativas.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  blockDurationMs: number = 120000 // 2 minutos de bloqueio
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitStore[key];

  if (!entry) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Se o bloqueio já expirou, reseta se tiver passado do limite
  if (entry.attempts >= maxAttempts && entry.blockedUntil <= now) {
    delete rateLimitStore[key];
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Registra uma tentativa falha para a chave. Bloqueia se atingir o limite.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 5,
  blockDurationMs: number = 120000
): void {
  const now = Date.now();
  const entry = rateLimitStore[key] || { attempts: 0, blockedUntil: 0 };

  entry.attempts += 1;
  if (entry.attempts >= maxAttempts) {
    entry.blockedUntil = now + blockDurationMs;
  }

  rateLimitStore[key] = entry;
}

/**
 * Reseta o contador de tentativas quando uma ação é bem-sucedida.
 */
export function resetRateLimit(key: string): void {
  delete rateLimitStore[key];
}
