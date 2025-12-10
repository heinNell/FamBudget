import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Database table names */
export const TABLES = {
  INCOMES: 'incomes',
  TAXES: 'taxes',
  EXPENSES: 'expenses',
  BALANCE_ACCOUNTS: 'balance_accounts',
  BALANCE_HISTORY: 'balance_history',
} as const;
