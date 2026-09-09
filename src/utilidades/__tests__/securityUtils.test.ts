import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSecureOTP,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '../securityUtils';

describe('securityUtils', () => {
  describe('hashPassword & verifyPassword (PBKDF2 & Retrocompatibilidade)', () => {
    it('deve gerar hash moderno no padrão PBKDF2 com iterações e salt', async () => {
      const hash = await hashPassword('MinhaSenhaSecreta!123');
      expect(hash).toMatch(/^pbkdf2\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/);
    });

    it('deve gerar sais diferentes para a mesma senha quando chamado repetidamente', async () => {
      const hash1 = await hashPassword('MinhaSenhaSecreta!123');
      const hash2 = await hashPassword('MinhaSenhaSecreta!123');
      expect(hash1).not.toBe(hash2); // Sais aleatórios de 16 bytes garantem unicidade
    });

    it('deve verificar senha com sucesso no padrão PBKDF2', async () => {
      const password = 'SenhaCorreta#2026';
      const hash = await hashPassword(password);
      const isMatch = await verifyPassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('deve rejeitar senha incorreta no padrão PBKDF2', async () => {
      const hash = await hashPassword('SenhaCorreta#2026');
      const isMatch = await verifyPassword('SenhaErrada', hash);
      expect(isMatch).toBe(false);
    });

    it('deve manter 100% de retrocompatibilidade com hashes legados SHA-256', async () => {
      // Hash SHA-256 legado pré-calculado com o LEGACY_SALT_PEPPER para "123456"
      const legacyHash123456 = '09fba8ef3f0ecb4ddc60dbfdf0a7bf7406a57e9a622a7372a05d663684f6f6a5';
      const isMatch = await verifyPassword('123456', legacyHash123456);
      expect(isMatch).toBe(true);

      const isWrong = await verifyPassword('senha_errada', legacyHash123456);
      expect(isWrong).toBe(false);
    });

    it('deve retornar false se senha ou hash forem vazios', async () => {
      expect(await verifyPassword('', 'qualquerhash')).toBe(false);
      expect(await verifyPassword('senha', '')).toBe(false);
    });
  });

  describe('generateSecureOTP', () => {
    it('deve gerar um código numérico de 6 dígitos por padrão', () => {
      const otp = generateSecureOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('deve respeitar comprimento personalizado quando solicitado', () => {
      const otp4 = generateSecureOTP(4);
      expect(otp4).toMatch(/^\d{4}$/);
      const otp8 = generateSecureOTP(8);
      expect(otp8).toMatch(/^\d{8}$/);
    });

    it('deve gerar códigos randômicos com baixa probabilidade de colisão imediata', () => {
      const otps = new Set<string>();
      for (let i = 0; i < 20; i++) {
        otps.add(generateSecureOTP());
      }
      expect(otps.size).toBeGreaterThan(15);
    });
  });

  describe('Rate Limiting (checkRateLimit, recordFailedAttempt, resetRateLimit)', () => {
    const testKey = 'test_ip_192_168_0_1';

    beforeEach(() => {
      resetRateLimit(testKey);
    });

    it('deve permitir tentativas iniciais dentro do limite', () => {
      const check1 = checkRateLimit(testKey, 3, 60000);
      expect(check1.allowed).toBe(true);
      expect(check1.retryAfterSeconds).toBe(0);
    });

    it('deve bloquear após atingir o número máximo de tentativas', () => {
      recordFailedAttempt(testKey, 3, 60000);
      recordFailedAttempt(testKey, 3, 60000);
      expect(checkRateLimit(testKey, 3, 60000).allowed).toBe(true);

      // 3ª tentativa (atinge limite)
      recordFailedAttempt(testKey, 3, 60000);
      const blocked = checkRateLimit(testKey, 3, 60000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('deve resetar o contador e liberar o acesso com resetRateLimit', () => {
      recordFailedAttempt(testKey, 2, 60000);
      recordFailedAttempt(testKey, 2, 60000);
      expect(checkRateLimit(testKey, 2, 60000).allowed).toBe(false);

      resetRateLimit(testKey);
      expect(checkRateLimit(testKey, 2, 60000).allowed).toBe(true);
    });
  });
});
