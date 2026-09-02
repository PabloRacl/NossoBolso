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

// Inicializa usuário padrão se não existir nenhum
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
    await new Promise((resolve) => setTimeout(resolve, 800));

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
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

    return newUser;
  },

  // Cadastro de novo usuário
  async register({ name, email }: RegisterPayload): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const users = getSavedUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      throw new Error('Já existe uma conta cadastrada com este email.');
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      provider: 'credentials',
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

    return newUser;
  },

  // Login Social (Google, Facebook, LinkedIn)
  async loginSocial(provider: 'google' | 'facebook' | 'linkedin'): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

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
