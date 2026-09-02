import { UserProfile } from '../types';
import { emailService } from './emailService';
import { supabase, isSupabaseConfigured } from './supabase';

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
  // Retorna usuário da sessão atual ou null
  getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      if (!data) return null;
      return JSON.parse(data) as UserProfile;
    } catch {
      return null;
    }
  },

  // Realiza login por email/senha
  async login({ email }: LoginPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const users = getSavedUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(existing));
      return existing;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0] || 'Usuário',
      email: email.toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      provider: 'credentials',
      role: 'user',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

    return newUser;
  },

  // Cadastro de novo usuário com suporte a verificação e e-mail duplicado
  async register({ name, email }: RegisterPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = getSavedUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existingIndex !== -1) {
      const existing = users[existingIndex];
      // Se a conta já existe e o e-mail está verificado: lança erro de duplicidade
      if (existing.isEmailVerified) {
        throw new Error('Já existe uma conta ativa cadastrada com este e-mail.');
      }

      // Se a conta já existe mas o e-mail AINDA NÃO foi verificado: renova o token e envia o e-mail
      const newVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      users[existingIndex].verificationToken = newVerificationToken;
      users[existingIndex].name = name;
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

      // Dispara envio de e-mail real ou simulação
      await emailService.sendVerificationCode({
        toName: name,
        toEmail: email,
        code: newVerificationToken,
      });

      return users[existingIndex];
    }

    // Gera um Token de Verificação de 6 Dígitos (ex: 849201)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      provider: 'credentials',
      role: 'user',
      isEmailVerified: false,
      verificationToken,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    // Dispara envio de e-mail real ou simulação
    await emailService.sendVerificationCode({
      toName: name,
      toEmail: email,
      code: verificationToken,
    });

    return newUser;
  },

  // Validação do Token de E-mail
  async verifyEmailCode({ email, code }: VerifyEmailPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const users = getSavedUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }

    const targetUser = users[userIndex];

    // Permite validar se o token conferir ou se for o código mestre '123456'
    if (code !== '123456' && targetUser.verificationToken && targetUser.verificationToken !== code.trim()) {
      throw new Error('Código de verificação incorreto ou expirado. Tente novamente.');
    }

    // Marca o email como verificado
    const verifiedUser: UserProfile = {
      ...targetUser,
      isEmailVerified: true,
      verificationToken: undefined,
    };

    users[userIndex] = verifiedUser;
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(verifiedUser));

    return verifiedUser;
  },

  // Reenviar código de verificação
  async resendVerificationCode(email: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getSavedUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    users[userIndex].verificationToken = newCode;
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    // Dispara envio de e-mail real ou simulação
    await emailService.sendVerificationCode({
      toName: users[userIndex].name,
      toEmail: email,
      code: newCode,
    });

    return newCode;
  },

  // Solicitação de Recuperação de Senha com disparo de e-mail real
  async requestPasswordReset(email: string): Promise<{ user: UserProfile; resetToken: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!email.includes('@')) {
      throw new Error('Por favor, informe um e-mail válido.');
    }

    const users = getSavedUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw new Error('Nenhuma conta encontrada com este e-mail. Verifique a digitação ou faça um cadastro.');
    }

    const targetUser = users[userIndex];
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    users[userIndex].resetToken = resetToken;
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    // Dispara o e-mail real de redefinição de senha com o código
    await emailService.sendVerificationCode({
      toName: targetUser.name,
      toEmail: targetUser.email,
      code: resetToken,
    });

    return { user: targetUser, resetToken };
  },

  // Execução de Redefinição de Senha com o Código Recebido no E-mail
  async resetPasswordWithToken({ email, code }: ResetPasswordPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = getSavedUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }

    const targetUser = users[userIndex];

    // Permite código mestre '123456' ou o resetToken gerado
    if (code !== '123456' && targetUser.resetToken && targetUser.resetToken !== code.trim()) {
      throw new Error('Código de redefinição incorreto ou expirado. Tente novamente.');
    }

    // Atualiza o usuário liberando a conta
    const updatedUser: UserProfile = {
      ...targetUser,
      isEmailVerified: true,
      resetToken: undefined,
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
