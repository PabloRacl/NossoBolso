import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Supabase SQL Schema setup guide script
export const SUPABASE_SQL_SCHEMA = `
-- Execute este script no SQL Editor do seu projeto Supabase:

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
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
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL,
  deadline TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debt_contracts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  installment_amount NUMERIC NOT NULL,
  total_installments INT NOT NULL,
  start_date TEXT NOT NULL,
  wallet_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;
