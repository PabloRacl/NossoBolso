import { UserProfile } from '../types';

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

  // Cadastro de novo usuário com Token de Validação por Email
  async register({ name, email }: RegisterPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = getSavedUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      throw new Error('Já existe uma conta cadastrada com este e-mail.');
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

    // Retorna o usuário com o token gerado para o formulário exibir a etapa de validação
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
    return newCode;
  },

  // Login Social (Google, Facebook, LinkedIn)
  async loginSocial(provider: 'google' | 'facebook' | 'linkedin'): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const socialNames: Record<string, string> = {
      google: 'Usuário Google',
      facebook: 'Usuário Facebook',
      linkedin: 'Usuário LinkedIn',
    };

    const name = socialNames[provider] || 'Usuário Conectado';
    const email = `${provider}_user_${Math.floor(Math.random() * 10000)}@nossobolso.app`;

    const user: UserProfile = {
      id: `usr_social_${Date.now()}`,
      name,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(provider)}`,
      provider,
      role: 'user',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  },

  // Recuperação de senha
  async requestPasswordReset(email: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (!email.includes('@')) {
      throw new Error('Por favor, informe um email válido.');
    }
    return true;
  },

  // Logout
  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    localStorage.removeItem(STORAGE_KEY_USER);
  },
};
