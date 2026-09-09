/**
 * Utilitários de Segurança do NossoBolso Finance OS
 * Implementa Criptografia via Web Crypto API nativa e proteção de Rate Limiting.
 */

const LEGACY_SALT_PEPPER = 'NossoBolso_Finance_OS_Sec_Salt_2026_v1';
const PBKDF2_ITERATIONS = 100_000;

/**
 * Converte Uint8Array para string hexadecimal.
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converte string hexadecimal para Uint8Array.
 */
function hexToBuffer(hex: string): Uint8Array<ArrayBuffer> {
  const matches = hex.match(/.{1,2}/g) || [];
  return Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Gera um hash criptográfico seguro a partir da senha utilizando PBKDF2 nativo (Web Crypto API)
 * com 100.000 iterações e salt aleatório de 16 bytes.
 * Formato gerado: pbkdf2$100000$<salt_hex>$<hash_hex>
 */
export async function hashPassword(password: string, customSaltHex?: string): Promise<string> {
  const enc = new TextEncoder();
  const saltBytes = customSaltHex
    ? hexToBuffer(customSaltHex)
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password.trim()),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const saltHex = bufferToHex(saltBytes);
  const hashHex = bufferToHex(derivedBits);

  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

/**
 * Gera um hash legado SHA-256 para verificação de contas pré-existentes.
 */
async function legacySha256(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${LEGACY_SALT_PEPPER}:${password.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Gera um código OTP criptograficamente seguro usando Web Crypto API.
 */
export function generateSecureOTP(length: number = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => (b % 10).toString())
    .join('');
}

/**
 * Verifica se a senha informada corresponde ao hash armazenado.
 * Suporta hashes modernos PBKDF2 (100k iterações) e preserva retrocompatibilidade com SHA-256 legado.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  // Verificação de hash moderno PBKDF2
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || PBKDF2_ITERATIONS;
      const saltHex = parts[2];
      const expectedHashHex = parts[3];

      const enc = new TextEncoder();
      const saltBytes = hexToBuffer(saltHex);

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password.trim()),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

      const computedHashHex = bufferToHex(derivedBits);
      return computedHashHex === expectedHashHex;
    }
  }

  // Fallback: verificação de hash legado SHA-256
  const computedLegacyHash = await legacySha256(password);
  return computedLegacyHash === storedHash;
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
