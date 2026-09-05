import { createClient } from '@supabase/supabase-js';

// Sanitização da URL base removendo /rest/v1 caso informado na cópia
const rawUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabaseUrl = rawUrl;

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('sua-url') &&
  !supabaseAnonKey.includes('placeholder') &&
  !supabaseAnonKey.includes('sua-chave') &&
  !supabaseAnonKey.includes('sua-anon-key') &&
  supabaseAnonKey.length > 20
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Supabase SQL Schema setup guide script com isolamento e segurança RLS
export const SUPABASE_SQL_SCHEMA = `
-- Execute este script no SQL Editor do seu projeto Supabase:
-- Habilita segurança multi-usuário com Row Level Security (RLS)

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  wallet_id TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_config JSONB,
  contract_id TEXT,
  installment_number INT,
  total_installments INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC NOT NULL,
  credit_limit NUMERIC,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL,
  deadline TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debt_contracts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  installment_amount NUMERIC NOT NULL,
  total_installments INT NOT NULL,
  start_date TEXT NOT NULL,
  wallet_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita Row Level Security (RLS) em todas as tabelas
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_contracts ENABLE ROW LEVEL SECURITY;

-- Políticas de isolamento estrito: cada usuário acessa apenas seus próprios dados
CREATE POLICY "Transações isoladas por usuário" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Carteiras isoladas por usuário" ON wallets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Metas isoladas por usuário" ON goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Contratos de dívida isolados por usuário" ON debt_contracts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`;
