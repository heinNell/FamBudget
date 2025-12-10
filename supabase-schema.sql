-- Supabase Schema for Family Budget Planner
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member TEXT NOT NULL CHECK (member IN ('Nikkie', 'Hein')),
  income_type TEXT NOT NULL DEFAULT 'Salary' CHECK (income_type IN ('Salary', 'Other')),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for income type
CREATE INDEX IF NOT EXISTS idx_incomes_type ON incomes(income_type);

-- Taxes table
CREATE TABLE IF NOT EXISTS taxes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member TEXT NOT NULL CHECK (member IN ('Nikkie', 'Hein')),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member TEXT NOT NULL CHECK (member IN ('Nikkie', 'Hein')),
  category TEXT NOT NULL CHECK (category IN (
    'Housing', 'Utilities', 'Groceries', 'Transportation',
    'Healthcare', 'Entertainment', 'Dining', 'Shopping',
    'Education', 'Insurance', 'Savings', 'Other'
  )),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  month TEXT NOT NULL, -- Format: YYYY-MM
  is_shared BOOLEAN DEFAULT FALSE,
  balance_account_id UUID REFERENCES balance_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_incomes_month ON incomes(month);
CREATE INDEX IF NOT EXISTS idx_incomes_member ON incomes(member);
CREATE INDEX IF NOT EXISTS idx_taxes_month ON taxes(month);
CREATE INDEX IF NOT EXISTS idx_taxes_member ON taxes(member);
CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month);
CREATE INDEX IF NOT EXISTS idx_expenses_member ON expenses(member);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Enable Row Level Security (optional - for production use)
-- ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for development)
-- In production, you would want proper authentication
CREATE POLICY "Allow all access to incomes" ON incomes FOR ALL USING (true);
CREATE POLICY "Allow all access to taxes" ON taxes FOR ALL USING (true);
CREATE POLICY "Allow all access to expenses" ON expenses FOR ALL USING (true);

-- Balance Accounts table (for tracking balances that deduct monthly)
CREATE TABLE IF NOT EXISTS balance_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  initial_balance DECIMAL(12, 2) NOT NULL CHECK (initial_balance >= 0),
  current_balance DECIMAL(12, 2) NOT NULL CHECK (current_balance >= 0),
  monthly_deduction DECIMAL(12, 2) NOT NULL CHECK (monthly_deduction >= 0),
  start_month TEXT NOT NULL, -- Format: YYYY-MM (when deductions start)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Balance History table (optional - for tracking historical changes)
CREATE TABLE IF NOT EXISTS balance_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES balance_accounts(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  opening_balance DECIMAL(12, 2) NOT NULL,
  deduction DECIMAL(12, 2) NOT NULL,
  closing_balance DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for balance tables
CREATE INDEX IF NOT EXISTS idx_balance_accounts_name ON balance_accounts(name);
CREATE INDEX IF NOT EXISTS idx_balance_history_account ON balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_month ON balance_history(month);

-- Policies for balance tables
CREATE POLICY "Allow all access to balance_accounts" ON balance_accounts FOR ALL USING (true);
CREATE POLICY "Allow all access to balance_history" ON balance_history FOR ALL USING (true);
