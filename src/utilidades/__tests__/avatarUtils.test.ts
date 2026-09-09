import { describe, it, expect } from 'vitest';
import { getAnonymousAvatarSeed, getSafeDicebearAvatar } from '../avatarUtils';

describe('avatarUtils — Anonimização de Avatares', () => {
  it('deve gerar seed determinística e anônima para um e-mail', () => {
    const seed1 = getAnonymousAvatarSeed('usuario@nossobolso.app');
    const seed2 = getAnonymousAvatarSeed('usuario@nossobolso.app');

    expect(seed1).toBe(seed2);
    expect(seed1).toMatch(/^avatar_[a-f0-9]{8}$/);
    expect(seed1).not.toContain('usuario');
    expect(seed1).not.toContain('@');
  });

  it('deve gerar URLs seguras do DiceBear sem vazar dados sensíveis', () => {
    const url = getSafeDicebearAvatar('pablo@empresa.com.br');

    expect(url).toContain('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar_');
    expect(url).not.toContain('pablo');
    expect(url).not.toContain('empresa.com.br');
  });

  it('deve lidar com entradas vazias graciosamente', () => {
    const seed = getAnonymousAvatarSeed('');
    expect(seed).toBe('user_avatar_default');
  });
});
