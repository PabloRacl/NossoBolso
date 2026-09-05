import { UserProfile } from '../tipos';
import { emailService } from './emailService';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '../utilidades/securityUtils';

const STORAGE_KEY_USER = 'nossobolso_auth_user';
const STORAGE_KEY_USERS_DB = 'nossobolso_registered_users';

interface LoginPayload {
  email: string;
  password?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
}

interface VerifyEmailPayload {
  email: string;
  code: string;
}

interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword?: string;
}

interface SocialLoginPayload {
  provider: 'google' | 'facebook' | 'linkedin' | 'twitter';
  email?: string;
  name?: string;
  avatarUrl?: string;
}

// Inicializa usuários registrados no banco de dados local
const getSavedUsers = (): UserProfile[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_USERS_DB);
    if (!data) {
      const defaultUser: UserProfile = {
        id: 'usr_default_01',
        name: 'Pablo Ricardo',
        email: 'pablo@nossobolso.app',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'credentials',
        role: 'user',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify([defaultUser]));
      return [defaultUser];
    }
    return JSON.parse(data) as UserProfile[];
  } catch {
    return [];
  }
};

export const authService = {
  // Retorna usuário da sessão atual ou null (exige e-mail verificado)
  getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      if (!data) return null;
      const user = JSON.parse(data) as UserProfile;
      // REGRA DE SEGURANÇA: Bloqueia sessões de usuários não verificados
      if (!user || !user.isEmailVerified) {
        localStorage.removeItem(STORAGE_KEY_USER);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  },

  // Realiza login por email/senha com verificação estrita
  async login({ email, password }: LoginPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const normalizedEmail = (email || '').trim().toLowerCase();

    // 1. Proteção de Rate Limiting contra Força Bruta
    const rateCheck = checkRateLimit(`login:${normalizedEmail}`, 5, 120000);
    if (!rateCheck.allowed) {
      throw new Error(`Muitas tentativas consecutivas de acesso. Aguarde ${rateCheck.retryAfterSeconds} segundos para tentar novamente.`);
    }

    if (!normalizedEmail) {
      throw new Error('Por favor, informe seu e-mail.');
    }

    const users = getSavedUsers();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    // 2. BLOQUEIO DE AUTO-REGISTRO: Usuário inexistente deve falhar
    if (!existing) {
      recordFailedAttempt(`login:${normalizedEmail}`, 5, 120000);
      throw new Error('E-mail ou senha incorretos.');
    }

    // 3. BLOQUEIO CRÍTICO: E-mail não verificado
    if (!existing.isEmailVerified) {
      const now = Date.now();
      const isTokenExpired = !existing.verificationTokenExpiresAt || new Date(existing.verificationTokenExpiresAt).getTime() < now;
      if (isTokenExpired || !existing.verificationToken) {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        existing.verificationToken = newCode;
        existing.verificationTokenExpiresAt = new Date(now + 15 * 60 * 1000).toISOString();
        const userIdx = users.findIndex((u) => u.id === existing.id);
        if (userIdx !== -1) {
          users[userIdx] = existing;
          localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
        }
        await emailService.sendVerificationCode({
          toName: existing.name,
          toEmail: existing.email,
          code: newCode,
        });
      }
      throw new Error('EMAIL_NOT_VERIFIED: Este e-mail ainda não foi confirmado. Enviamos um código para sua caixa de entrada para ativação.');
    }

    // 4. Verificação Criptográfica de Senha
    if (existing.provider === 'credentials') {
      if (!password) {
        throw new Error('Por favor, informe a sua senha.');
      }

      if (existing.passwordHash) {
        const isPasswordCorrect = await verifyPassword(password, existing.passwordHash);
        if (!isPasswordCorrect) {
          recordFailedAttempt(`login:${normalizedEmail}`, 5, 120000);
          throw new Error('E-mail ou senha incorretos.');
        }
      } else {
        // Migração suave de usuário prévio: armazena hash da senha informada
        existing.passwordHash = await hashPassword(password);
        const userIdx = users.findIndex((u) => u.id === existing.id);
        if (userIdx !== -1) {
          users[userIdx] = existing;
          localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
        }
      }
    }

    // Login aprovado com sucesso
    resetRateLimit(`login:${normalizedEmail}`);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(existing));

    return existing;
  },

  // Cadastro seguro com hash de senha e validação prévia de e-mail
  async register({ name, email, password }: RegisterPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!name || name.trim().length < 2) {
      throw new Error('Por favor, informe seu nome completo.');
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Por favor, informe um e-mail válido.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve conter no mínimo 6 caracteres.');
    }

    const rateCheck = checkRateLimit(`register:${normalizedEmail}`, 5, 120000);
    if (!rateCheck.allowed) {
      throw new Error(`Muitas tentativas de cadastro. Aguarde ${rateCheck.retryAfterSeconds} segundos.`);
    }

    const users = getSavedUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    const passwordHash = await hashPassword(password);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (existingIndex !== -1) {
      const existing = users[existingIndex];
      // Se a conta já existe e o e-mail está verificado: impede duplicidade
      if (existing.isEmailVerified) {
        throw new Error('Já existe uma conta ativa cadastrada com este e-mail.');
      }

      // Se a conta existe mas não foi verificada, renova token e atualiza dados
      users[existingIndex] = {
        ...existing,
        name: name.trim(),
        passwordHash,
        verificationToken,
        verificationTokenExpiresAt,
      };
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

      await emailService.sendVerificationCode({
        toName: name.trim(),
        toEmail: normalizedEmail,
        code: verificationToken,
      });

      return users[existingIndex];
    }

    // Cria novo usuário pendente de validação
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      provider: 'credentials',
      role: 'user',
      isEmailVerified: false,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    // NOTA DE SEGURANÇA: NÃO persistir em STORAGE_KEY_USER aqui para impedir login não verificado!

    await emailService.sendVerificationCode({
      toName: name.trim(),
      toEmail: normalizedEmail,
      code: verificationToken,
    });

    return newUser;
  },

  // Validação Estrita do Token de E-mail (Sem códigos mestres)
  async verifyEmailCode({ email, code }: VerifyEmailPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const normalizedEmail = (email || '').trim().toLowerCase();
    const trimmedCode = (code || '').trim();

    const rateCheck = checkRateLimit(`verify:${normalizedEmail}`, 6, 180000);
    if (!rateCheck.allowed) {
      throw new Error(`Muitas tentativas inválidas. Bloqueio temporário por segurança. Tente novamente em ${rateCheck.retryAfterSeconds} segundos.`);
    }

    const users = getSavedUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }

    const targetUser = users[userIndex];

    if (targetUser.isEmailVerified) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(targetUser));
      return targetUser;
    }

    // Validação estrita: somente o token gerado confere
    if (!targetUser.verificationToken || targetUser.verificationToken !== trimmedCode) {
      recordFailedAttempt(`verify:${normalizedEmail}`, 6, 180000);
      throw new Error('Código de verificação incorreto. Verifique sua caixa de entrada ou solicite novo código.');
    }

    // Validação de expiração temporal (15 minutos)
    if (targetUser.verificationTokenExpiresAt) {
      const expiresAt = new Date(targetUser.verificationTokenExpiresAt).getTime();
      if (Date.now() > expiresAt) {
        throw new Error('Este código de verificação expirou (validade de 15 minutos). Solicite o reenvio de um novo código.');
      }
    }

    // Marca o email como verificado e limpa tokens temporários
    resetRateLimit(`verify:${normalizedEmail}`);
    const verifiedUser: UserProfile = {
      ...targetUser,
      isEmailVerified: true,
      verificationToken: undefined,
      verificationTokenExpiresAt: undefined,
    };

    users[userIndex] = verifiedUser;
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(verifiedUser));

    return verifiedUser;
  },

  // Reenviar código de verificação com proteção anti-flood
  async resendVerificationCode(email: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const normalizedEmail = (email || '').trim().toLowerCase();

    const rateCheck = checkRateLimit(`resend:${normalizedEmail}`, 3, 60000);
    if (!rateCheck.allowed) {
      throw new Error(`Aguarde ${rateCheck.retryAfterSeconds} segundos para solicitar outro código.`);
    }

    const users = getSavedUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }

    recordFailedAttempt(`resend:${normalizedEmail}`, 3, 60000);

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    users[userIndex].verificationToken = newCode;
    users[userIndex].verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    await emailService.sendVerificationCode({
      toName: users[userIndex].name,
      toEmail: normalizedEmail,
      code: newCode,
    });

    return newCode;
  },

  // Solicitação de Recuperação de Senha com disparo de e-mail e expiração
  async requestPasswordReset(email: string): Promise<{ user: UserProfile; resetToken: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail.includes('@')) {
      throw new Error('Por favor, informe um e-mail válido.');
    }

    const rateCheck = checkRateLimit(`reset_req:${normalizedEmail}`, 4, 120000);
    if (!rateCheck.allowed) {
      throw new Error(`Aguarde ${rateCheck.retryAfterSeconds} segundos antes de solicitar nova recuperação de senha.`);
    }

    const users = getSavedUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      throw new Error('Nenhuma conta encontrada com este e-mail. Verifique a digitação ou faça um cadastro.');
    }

    recordFailedAttempt(`reset_req:${normalizedEmail}`, 4, 120000);

    const targetUser = users[userIndex];
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    users[userIndex].resetToken = resetToken;
    users[userIndex].resetTokenExpiresAt = resetTokenExpiresAt;
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    await emailService.sendVerificationCode({
      toName: targetUser.name,
      toEmail: targetUser.email,
      code: resetToken,
    });

    return { user: targetUser, resetToken };
  },

  // Redefinição de Senha com código estrito e nova senha com hash
  async resetPasswordWithToken({ email, code, newPassword }: ResetPasswordPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const normalizedEmail = (email || '').trim().toLowerCase();
    const trimmedCode = (code || '').trim();

    const rateCheck = checkRateLimit(`reset_exec:${normalizedEmail}`, 5, 180000);
    if (!rateCheck.allowed) {
      throw new Error(`Muitas tentativas incorretas. Tente novamente em ${rateCheck.retryAfterSeconds} segundos.`);
    }

    const users = getSavedUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }

    const targetUser = users[userIndex];

    // Validação estrita sem backdoors
    if (!targetUser.resetToken || targetUser.resetToken !== trimmedCode) {
      recordFailedAttempt(`reset_exec:${normalizedEmail}`, 5, 180000);
      throw new Error('Código de redefinição incorreto ou expirado. Tente novamente.');
    }

    if (targetUser.resetTokenExpiresAt) {
      const expiresAt = new Date(targetUser.resetTokenExpiresAt).getTime();
      if (Date.now() > expiresAt) {
        throw new Error('Este código de redefinição expirou. Solicite um novo código de recuperação.');
      }
    }

    if (newPassword && newPassword.length < 6) {
      throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
    }

    resetRateLimit(`reset_exec:${normalizedEmail}`);

    const updatedPasswordHash = newPassword ? await hashPassword(newPassword) : targetUser.passwordHash;

    const updatedUser: UserProfile = {
      ...targetUser,
      passwordHash: updatedPasswordHash,
      isEmailVerified: true,
      resetToken: undefined,
      resetTokenExpiresAt: undefined,
    };

    users[userIndex] = updatedUser;
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));

    return updatedUser;
  },

  // Login Social (Google, Twitter/X, Facebook, LinkedIn)
  async loginSocial(payload: 'google' | 'facebook' | 'linkedin' | 'twitter' | SocialLoginPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    let provider: 'google' | 'facebook' | 'linkedin' | 'twitter';
    let email: string | undefined;
    let name: string | undefined;
    let avatarUrl: string | undefined;

    if (typeof payload === 'string') {
      provider = payload;
    } else {
      provider = payload.provider;
      email = payload.email;
      name = payload.name;
      avatarUrl = payload.avatarUrl;
    }

    const defaultNames: Record<string, string> = {
      google: 'Pablo Ricardo',
      twitter: 'Pablo Ricardo (X)',
      facebook: 'Pablo Ricardo (Facebook)',
      linkedin: 'Pablo Ricardo (LinkedIn)',
    };

    const finalEmail = (email || 'pabloracl@gmail.com').toLowerCase();
    const finalName = name || defaultNames[provider] || 'Usuário Conectado';
    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalName)}`;

    const users = getSavedUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === finalEmail);

    const user: UserProfile = {
      id: existingIndex !== -1 ? users[existingIndex].id : `usr_${provider}_${Date.now()}`,
      name: finalName,
      email: finalEmail,
      avatarUrl: finalAvatar,
      provider,
      role: 'user',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...user, isEmailVerified: true };
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(users[existingIndex]));
      return users[existingIndex];
    }

    users.push(user);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

    return user;
  },

  // Login Real Oficial com Provedores OAuth (Google, X / Twitter, LinkedIn)
  async loginWithOAuthProvider(provider: 'google' | 'twitter' | 'linkedin'): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) {
      return {
        error: 'O Supabase não está configurado no arquivo .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
      };
    }

    const providerNames: Record<string, string> = {
      google: 'Google',
      twitter: 'X (Twitter)',
      linkedin: 'LinkedIn',
    };
    const pName = providerNames[provider] || provider;

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        if (
          error.message.includes('not enabled') ||
          error.message.includes('Unsupported provider') ||
          error.message.includes('validation_failed')
        ) {
          return {
            error: `O provedor ${pName} ainda não foi ativado no painel do Supabase. Para abrir a tela oficial do ${pName}, ative o ${pName} em Authentication > Providers no painel da Supabase.`,
          };
        }
        return { error: error.message };
      }

      if (data?.url) {
        // Pré-validar a URL para evitar jogar o usuário na tela branca de erro do Supabase se o provedor não estiver ativo
        try {
          const checkRes = await fetch(data.url, { method: 'GET', redirect: 'manual' });
          if (checkRes.status === 400) {
            const errJson = await checkRes.json();
            if (errJson.msg?.includes('provider is not enabled') || errJson.msg?.includes('Unsupported provider')) {
              return {
                error: `O provedor ${pName} ainda não foi ativado no painel do Supabase. Para que a tela do ${pName} abra, ative o ${pName} em Authentication > Providers no painel da Supabase.`,
              };
            }
          }
        } catch {
          // Se falhar CORS ou redirect opaco, significa que pode redirecionar normalmente
        }

        // Redireciona o navegador para a tela oficial de login do provedor
        window.location.href = data.url;
      }
      return {};
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Erro ao iniciar autenticação com ${pName}`;
      return { error: msg };
    }
  },

  async loginWithGoogleReal(): Promise<{ error?: string }> {
    return this.loginWithOAuthProvider('google');
  },

  async loginWithTwitterReal(): Promise<{ error?: string }> {
    return this.loginWithOAuthProvider('twitter');
  },

  // Sincroniza sessão retornada de provedores OAuth (Supabase)
  async syncSupabaseSession(): Promise<UserProfile | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const suUser = session.user;
        const suProvider = (suUser.app_metadata?.provider as UserProfile['provider']) || 'google';
        const profile: UserProfile = {
          id: suUser.id,
          name:
            suUser.user_metadata?.full_name ||
            suUser.user_metadata?.name ||
            suUser.user_metadata?.user_name ||
            suUser.email?.split('@')[0] ||
            'Usuário Conectado',
          email: suUser.email || `${suUser.user_metadata?.user_name || 'usuario'}@x.com`,
          avatarUrl:
            suUser.user_metadata?.avatar_url ||
            suUser.user_metadata?.picture ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(suUser.email || suUser.id)}`,
          provider: suProvider,
          role: 'user',
          isEmailVerified: true,
          createdAt: suUser.created_at || new Date().toISOString(),
        };

        const users = getSavedUsers();
        const existingIndex = users.findIndex(
          (u) => u.email.toLowerCase() === profile.email.toLowerCase()
        );
        if (existingIndex !== -1) {
          users[existingIndex] = { ...users[existingIndex], ...profile };
        } else {
          users.push(profile);
        }
        localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));

        return profile;
      }
    } catch (err) {
      console.error('Erro ao sincronizar sessão Supabase:', err);
    }
    return null;
  },

  // Logout
  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      await supabase.auth.signOut();
    } catch {
      // Falha silenciosa se Supabase não estiver ativo
    }
    localStorage.removeItem(STORAGE_KEY_USER);
  },
};
