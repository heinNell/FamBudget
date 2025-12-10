/** Family member identifier */
export type FamilyMember = 'Nikkie' | 'Hein';

/** Income type - Salary or Other */
export type IncomeType = 'Salary' | 'Other';

/** Income entry for a family member */
export interface Income {
  id: string;
  member: FamilyMember;
  income_type: IncomeType;
  description: string;
  amount: number;
  month: string; // Format: YYYY-MM
  created_at: string;
}

/** Tax entry for a family member */
export interface Tax {
  id: string;
  member: FamilyMember;
  description: string;
  amount: number;
  month: string; // Format: YYYY-MM
  created_at: string;
}

/** Expense category */
export type ExpenseCategory =
  | 'Housing'
  | 'Utilities'
  | 'Groceries'
  | 'Transportation'
  | 'Healthcare'
  | 'Entertainment'
  | 'Dining'
  | 'Shopping'
  | 'Education'
  | 'Insurance'
  | 'Savings'
  | 'Other';

/** Expense entry */
export interface Expense {
  id: string;
  member: FamilyMember;
  category: ExpenseCategory;
  description: string;
  amount: number;
  month: string; // Format: YYYY-MM
  is_shared: boolean;
  balance_account_id: string | null; // Link to balance account for loan/debt payments
  created_at: string;
}

/** Monthly summary for a family member */
export interface MemberSummary {
  member: FamilyMember;
  grossIncome: number;
  otherIncome: number;
  totalIncome: number;
  totalTaxes: number;
  netIncome: number;
  totalExpenses: number;
  remainingBalance: number;
}

/** Combined household summary */
export interface HouseholdSummary {
  grossIncome: number;
  otherIncome: number;
  totalIncome: number;
  totalTaxes: number;
  netIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  nikkieSummary: MemberSummary;
  heinSummary: MemberSummary;
}

/** Form data for creating/editing income */
export interface IncomeFormData {
  member: FamilyMember;
  income_type: IncomeType;
  description: string;
  amount: number;
}

/** Form data for creating/editing tax */
export interface TaxFormData {
  member: FamilyMember;
  description: string;
  amount: number;
}

/** Form data for creating/editing expense */
export interface ExpenseFormData {
  member: FamilyMember;
  category: ExpenseCategory;
  description: string;
  amount: number;
  is_shared: boolean;
  balance_account_id?: string | null; // Optional link to balance account
}

/** Balance account for tracking recurring deductions */
export interface BalanceAccount {
  id: string;
  name: string;
  description: string;
  initial_balance: number;
  current_balance: number;
  monthly_deduction: number;
  start_month: string; // Format: YYYY-MM (when deductions start)
  created_at: string;
}

/** Form data for creating/editing balance account */
export interface BalanceAccountFormData {
  name: string;
  description: string;
  initial_balance: number;
  monthly_deduction: number;
  start_month: string;
}

/** Balance history entry for tracking monthly changes */
export interface BalanceHistory {
  id: string;
  account_id: string;
  month: string;
  opening_balance: number;
  deduction: number;
  closing_balance: number;
  created_at: string;
}
