import { UserProfile } from '../tipos';
import { emailService } from './emailService';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  generateSecureOTP,
} from '../utilidades/securityUtils';
import { getSafeDicebearAvatar } from '../utilidades/avatarUtils';

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

// Inicializa usuários registrados no banco de dados local (inicia vazio para segurança estrita)
const getSavedUsers = (): UserProfile[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_USERS_DB);
    if (!data) {
      return [];
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

    // 2. Tenta autenticação no Supabase Auth caso esteja configurado
    if (isSupabaseConfigured && password) {
      try {
        const { data: suData, error: suError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (!suError && suData.user) {
          const suUser = suData.user;
          const profile: UserProfile = {
            id: suUser.id,
            name: suUser.user_metadata?.full_name || suUser.user_metadata?.name || normalizedEmail.split('@')[0],
            email: suUser.email || normalizedEmail,
            avatarUrl: suUser.user_metadata?.avatar_url || getSafeDicebearAvatar(normalizedEmail),
            provider: 'credentials',
            role: 'user',
            isEmailVerified: Boolean(suUser.email_confirmed_at),
            createdAt: suUser.created_at || new Date().toISOString(),
          };

          resetRateLimit(`login:${normalizedEmail}`);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
          return profile;
        }
      } catch {
        // Falha na conexão de rede do Supabase: segue para verificação do banco local
      }
    }

    const users = getSavedUsers();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    // 3. BLOQUEIO DE AUTO-REGISTRO: Usuário inexistente deve falhar
    if (!existing) {
      recordFailedAttempt(`login:${normalizedEmail}`, 5, 120000);
      throw new Error('E-mail ou senha incorretos.');
    }

    // 4. BLOQUEIO: E-mail não verificado
    if (!existing.isEmailVerified) {
      if (!emailService.isRealEmailConfigured()) {
        // Em ambiente local/offline sem SMTP configurado, ativação automática
        existing.isEmailVerified = true;
        const userIdx = users.findIndex((u) => u.id === existing.id);
        if (userIdx !== -1) {
          users[userIdx] = existing;
          localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
        }
      } else {
        const now = Date.now();
        const isTokenExpired = !existing.verificationTokenExpiresAt || new Date(existing.verificationTokenExpiresAt).getTime() < now;
        if (isTokenExpired || !existing.verificationToken) {
          const newCode = generateSecureOTP(6);
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
    }

    // 5. Verificação Criptográfica de Senha e Bloqueio de Senha Fraca Padrão
    if (existing.provider === 'credentials') {
      if (!password) {
        throw new Error('Por favor, informe a sua senha.');
      }

      // Bloqueio rigoroso de conta legada com senha '123456'
      const INSECURE_DEFAULT_HASH = '09fba8ef3f0ecb4ddc60dbfdf0a7bf7406a57e9a622a7372a05d663684f6f6a5';
      if (existing.passwordHash === INSECURE_DEFAULT_HASH || !existing.passwordHash || password === '123456') {
        recordFailedAttempt(`login:${normalizedEmail}`, 5, 120000);
        throw new Error('Esta conta utiliza uma senha legada descontinuada. Por segurança, utilize a opção "Esqueci minha senha" para cadastrar uma nova senha forte.');
      }

      const isPasswordCorrect = await verifyPassword(password, existing.passwordHash);
      if (!isPasswordCorrect) {
        recordFailedAttempt(`login:${normalizedEmail}`, 5, 120000);
        throw new Error('E-mail ou senha incorretos.');
      }

      // Se o hash for de formato legado, atualiza automaticamente para PBKDF2 transparente
      if (!existing.passwordHash.startsWith('pbkdf2$')) {
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

  // Cadastro seguro com hash de senha PBKDF2 e validação estrita
  async register({ name, email, password }: RegisterPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!name || name.trim().length < 2) {
      throw new Error('Por favor, informe seu nome completo.');
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Por favor, informe um e-mail válido.');
    }
    if (!password || password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      throw new Error('A senha deve conter no mínimo 8 caracteres, incluindo letras e números.');
    }

    const rateCheck = checkRateLimit(`register:${normalizedEmail}`, 5, 120000);
    if (!rateCheck.allowed) {
      throw new Error(`Muitas tentativas de cadastro. Aguarde ${rateCheck.retryAfterSeconds} segundos.`);
    }

    const users = getSavedUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    const passwordHash = await hashPassword(password);
    const verificationToken = generateSecureOTP(6);
    const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Integração com Supabase Auth caso configurado
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { name: name.trim() },
          },
        });
      } catch (err: unknown) {
        console.warn('[Supabase Auth] Não foi possível registrar na nuvem, mantendo cadastro local:', err);
      }
    }

    const isAutoVerified = !emailService.isRealEmailConfigured();

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
        isEmailVerified: isAutoVerified,
        verificationToken,
        verificationTokenExpiresAt,
      };
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

      if (isAutoVerified) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(users[existingIndex]));
      } else {
        await emailService.sendVerificationCode({
          toName: name.trim(),
          toEmail: normalizedEmail,
          code: verificationToken,
        });
      }

      return users[existingIndex];
    }

    // Cria novo usuário
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      avatarUrl: getSafeDicebearAvatar(name.trim()),
      provider: 'credentials',
      role: 'user',
      isEmailVerified: isAutoVerified,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    if (isAutoVerified) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    } else {
      await emailService.sendVerificationCode({
        toName: name.trim(),
        toEmail: normalizedEmail,
        code: verificationToken,
      });
    }

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
      throw new Error('Este e-mail já foi verificado anteriormente. Por favor, acesse sua conta informando a sua senha.');
    }

    // Validação estrita: somente o token gerado confere
    if (!targetUser.verificationToken || targetUser.verificationToken !== trimmedCode) {
      recordFailedAttempt(`verify:${normalizedEmail}`, 6, 180000);
      throw new Error('Código de verificação incorreto. Verifique sua caixa de entrada ou solicite novo código.');
    }

    // Validação de expiração temporal estrita (15 minutos)
    if (!targetUser.verificationTokenExpiresAt) {
      throw new Error('Código de verificação sem data de validade registrada. Solicite um novo código.');
    }
    const expiresAt = new Date(targetUser.verificationTokenExpiresAt).getTime();
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      throw new Error('Este código de verificação expirou (validade de 15 minutos). Solicite o reenvio de um novo código.');
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

    const newCode = generateSecureOTP(6);
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
    const resetToken = generateSecureOTP(6);
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

    if (!targetUser.resetTokenExpiresAt) {
      throw new Error('Código de redefinição sem data de validade registrada. Solicite um novo código de recuperação.');
    }
    const expiresAt = new Date(targetUser.resetTokenExpiresAt).getTime();
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      throw new Error('Este código de redefinição expirou. Solicite um novo código de recuperação.');
    }

    if (newPassword && (newPassword.length < 8 || !/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword))) {
      throw new Error('A nova senha deve ter no mínimo 8 caracteres, incluindo letras e números.');
    }

    resetRateLimit(`reset_exec:${normalizedEmail}`);

    const updatedPasswordHash = newPassword ? await hashPassword(newPassword) : targetUser.passwordHash;

    // Sincroniza atualização de senha com Supabase caso esteja conectado
    if (isSupabaseConfigured && newPassword) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch {
        // Falha silenciosa caso não haja sessão de recuperação no Supabase
      }
    }

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
    const finalAvatar = avatarUrl || getSafeDicebearAvatar(finalName);

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
      const existingUser = users[existingIndex];
      // Conexão social autorizada: vincula ou atualiza o perfil mantendo credenciais existentes e ativando e-mail
      const updatedUser: UserProfile = {
        ...existingUser,
        name: finalName || existingUser.name,
        avatarUrl: finalAvatar || existingUser.avatarUrl,
        provider: existingUser.provider === 'credentials' ? 'credentials' : provider,
        isEmailVerified: true,
      };
      users[existingIndex] = updatedUser;
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      return updatedUser;
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
        error: 'O Supabase não está configurado nas variáveis de ambiente deste servidor/deploy.',
      };
    }

    const providerNames: Record<string, string> = {
      google: 'Google',
      twitter: 'X (Twitter)',
      linkedin: 'LinkedIn',
    };
    const pName = providerNames[provider] || provider;

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        if (
          error.message.includes('not enabled') ||
          error.message.includes('Unsupported provider') ||
          error.message.includes('validation_failed')
        ) {
          return {
            error: `O provedor ${pName} ainda não foi ativado no painel do Supabase. Utilize a Conexão Social Segura do NossoBolso.`,
          };
        }
        return { error: error.message };
      }

      if (data?.url) {
        // Redireciona o navegador diretamente para a tela oficial sem requisição fetch Ajax (evitando bloqueio CORS)
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
            getSafeDicebearAvatar(suUser.id || 'usuario'),
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
