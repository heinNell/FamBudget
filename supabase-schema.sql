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

-- Balance Accounts table (for tracking balances that deduct monthly)
-- Must be created before expenses table due to foreign key reference
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
  is_recurring BOOLEAN DEFAULT FALSE, -- Flag for expenses that should carry over to next month
  is_paid BOOLEAN DEFAULT FALSE, -- Flag to mark expense as paid
  include_vat BOOLEAN DEFAULT FALSE, -- Flag to indicate if VAT (15%) should be applied
  note TEXT, -- Monthly note for the expense
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
-- Note: WITH CHECK (true) is required for INSERT operations
CREATE POLICY "Allow all access to incomes" ON incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to taxes" ON taxes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- Unnecessary Expenses table (discretionary spending that deducts from income)
CREATE TABLE IF NOT EXISTS unnecessary_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member TEXT NOT NULL CHECK (member IN ('Nikkie', 'Hein')),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  month TEXT NOT NULL, -- Format: YYYY-MM
  note TEXT, -- Monthly note for the expense
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for unnecessary expenses
CREATE INDEX IF NOT EXISTS idx_unnecessary_expenses_month ON unnecessary_expenses(month);
CREATE INDEX IF NOT EXISTS idx_unnecessary_expenses_member ON unnecessary_expenses(member);

-- Policy for unnecessary expenses
CREATE POLICY "Allow all access to unnecessary_expenses" ON unnecessary_expenses FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "Allow all access to balance_accounts" ON balance_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to balance_history" ON balance_history FOR ALL USING (true) WITH CHECK (true);

-- Budget Entries table (for budget tracker feature)
CREATE TABLE IF NOT EXISTS budget_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  budget_amount DECIMAL(12, 2) NOT NULL CHECK (budget_amount >= 0),
  month TEXT NOT NULL, -- Format: YYYY-MM
  member TEXT NOT NULL CHECK (member IN ('Nikkie', 'Hein')),
  category TEXT NOT NULL CHECK (category IN (
    'Housing', 'Utilities', 'Groceries', 'Transportation',
    'Healthcare', 'Entertainment', 'Dining', 'Shopping',
    'Education', 'Insurance', 'Savings', 'Other'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Expenses table (expenses tracked against budgets)
CREATE TABLE IF NOT EXISTS budget_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budget_entries(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for budget tables
CREATE INDEX IF NOT EXISTS idx_budget_entries_month ON budget_entries(month);
CREATE INDEX IF NOT EXISTS idx_budget_entries_member ON budget_entries(member);
CREATE INDEX IF NOT EXISTS idx_budget_entries_category ON budget_entries(category);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_budget ON budget_expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(date);

-- Policies for budget tables
CREATE POLICY "Allow all access to budget_entries" ON budget_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to budget_expenses" ON budget_expenses FOR ALL USING (true) WITH CHECK (true);

-- Financial Statements table (for uploading monthly financial documents)
CREATE TABLE IF NOT EXISTS financial_statements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month TEXT NOT NULL, -- Format: YYYY-MM
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size INTEGER NOT NULL, -- Size in bytes
  content_type TEXT NOT NULL, -- MIME type
  uploaded_by TEXT CHECK (uploaded_by IN ('Nikkie', 'Hein')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for financial statements
CREATE INDEX IF NOT EXISTS idx_financial_statements_month ON financial_statements(month);
CREATE INDEX IF NOT EXISTS idx_financial_statements_uploaded_by ON financial_statements(uploaded_by);

-- Policies for financial statements
CREATE POLICY "Allow all access to financial_statements" ON financial_statements FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- STORAGE BUCKET SETUP (Run manually in Supabase Dashboard)
-- =============================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: financial-statements
-- 4. Set as Private (not public)
-- 5. Click "Create bucket"
--
-- Then run these policies in SQL Editor:

-- Storage policy for uploads (INSERT)
-- CREATE POLICY "Allow uploads to financial-statements"
-- ON storage.objects FOR INSERT
-- TO anon
-- WITH CHECK (bucket_id = 'financial-statements');

-- Storage policy for downloads (SELECT)
-- CREATE POLICY "Allow downloads from financial-statements"
-- ON storage.objects FOR SELECT
-- TO anon
-- USING (bucket_id = 'financial-statements');

-- Storage policy for deletes (DELETE)
-- CREATE POLICY "Allow deletes from financial-statements"
-- ON storage.objects FOR DELETE
-- TO anon
-- USING (bucket_id = 'financial-statements');

-- Storage policy for updates (UPDATE)
-- CREATE POLICY "Allow updates in financial-statements"
-- ON storage.objects FOR UPDATE
-- TO anon
-- USING (bucket_id = 'financial-statements');
