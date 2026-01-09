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
  is_recurring: boolean; // Flag for recurring expenses that should carry over
  is_paid: boolean; // Flag to mark expense as paid
  note: string | null; // Monthly note for the expense
  balance_account_id: string | null; // Link to balance account for loan/debt payments
  created_at: string;
}

/** Unnecessary expense entry - discretionary spending */
export interface UnnecessaryExpense {
  id: string;
  member: FamilyMember;
  description: string;
  amount: number;
  month: string; // Format: YYYY-MM
  note: string | null; // Monthly note for the expense
  created_at: string;
}

/** Form data for creating/editing unnecessary expense */
export interface UnnecessaryExpenseFormData {
  member: FamilyMember;
  description: string;
  amount: number;
  note?: string | null; // Optional monthly note
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
  totalUnnecessaryExpenses: number;
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
  totalUnnecessaryExpenses: number;
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
  is_recurring: boolean; // Flag for recurring expenses
  is_shared: boolean;
  is_paid: boolean; // Flag to mark expense as paid
  note: string | null; // Monthly note for the expense
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

/** Budget entry for tracking budget amounts and expenses */
export interface BudgetEntry {
  id: string;
  name: string;
  description: string;
  budget_amount: number;
  month: string; // Format: YYYY-MM
  member: FamilyMember;
  category: ExpenseCategory;
  created_at: string;
}

/** Budget expense entry for tracking spending against a budget */
export interface BudgetExpense {
  id: string;
  budget_id: string;
  description: string;
  amount: number;
  date: string; // Format: YYYY-MM-DD
  created_at: string;
}

/** Form data for creating/editing budget entry */
export interface BudgetEntryFormData {
  name: string;
  description: string;
  budget_amount: number;
  member: FamilyMember;
  category: ExpenseCategory;
}

/** Form data for creating/editing budget expense */
export interface BudgetExpenseFormData {
  description: string;
  amount: number;
  date: string;
}

/** Budget summary with expenses */
export interface BudgetWithExpenses {
  budget: BudgetEntry;
  expenses: BudgetExpense[];
  totalSpent: number;
  remainingBalance: number;
  percentageUsed: number;
}

/** Financial statement document */
export interface FinancialStatement {
  id: string;
  month: string; // Format: YYYY-MM
  filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  uploaded_by: FamilyMember | null;
  notes: string;
  created_at: string;
}

/** Form data for uploading financial statement */
export interface FinancialStatementFormData {
  file: File;
  uploaded_by: FamilyMember;
  notes?: string;
}
