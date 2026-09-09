import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../authService';

const storageMock: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const key of Object.keys(storageMock)) {
      delete storageMock[key];
    }
  },
};

// @ts-expect-error Mock para ambiente Node
globalThis.localStorage = mockLocalStorage;

describe('authService — Segurança e Autenticação', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('não deve semear credenciais fracas ou padrão em banco limpo', () => {
    const user = authService.getCurrentUser();
    expect(user).toBeNull();
    const stored = localStorage.getItem('nossobolso_registered_users');
    expect(stored).toBeNull();
  });

  it('deve rejeitar cadastro com senha fraca (menos de 8 caracteres ou sem letras/números)', async () => {
    await expect(
      authService.register({
        name: 'Usuário Teste',
        email: 'teste@nossobolso.app',
        password: '123',
      })
    ).rejects.toThrow('A senha deve conter no mínimo 8 caracteres');

    await expect(
      authService.register({
        name: 'Usuário Teste',
        email: 'teste@nossobolso.app',
        password: 'apenasletras',
      })
    ).rejects.toThrow('incluindo letras e números');
  });

  it('deve rejeitar login com senha padrão legada "123456"', async () => {
    // Simula uma conta legada inserida no storage
    const legacyUser = {
      id: 'usr_legado',
      name: 'Legado',
      email: 'legado@nossobolso.app',
      provider: 'credentials',
      role: 'user',
      isEmailVerified: true,
      passwordHash: '09fba8ef3f0ecb4ddc60dbfdf0a7bf7406a57e9a622a7372a05d663684f6f6a5', // Hash de '123456'
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('nossobolso_registered_users', JSON.stringify([legacyUser]));

    await expect(
      authService.login({
        email: 'legado@nossobolso.app',
        password: '123456',
      })
    ).rejects.toThrow('Esta conta utiliza uma senha legada descontinuada');
  });
});
