import { useCallback, useEffect, useState } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import type {
    Expense,
    ExpenseFormData,
    FamilyMember,
    HouseholdSummary,
    Income,
    IncomeFormData,
    MemberSummary,
    Tax,
    TaxFormData,
} from '../types/budget';

/** Get current month in YYYY-MM format */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Format month string to display format */
export function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Calculate member summary */
function calculateMemberSummary(
  member: FamilyMember,
  incomes: Income[],
  taxes: Tax[],
  expenses: Expense[]
): MemberSummary {
  const memberIncomes = incomes.filter((i) => i.member === member);
  const memberTaxes = taxes.filter((t) => t.member === member);
  const memberExpenses = expenses.filter((e) => e.member === member);

  // Separate salary income from other income
  const grossIncome = memberIncomes
    .filter((i) => i.income_type === 'Salary')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const otherIncome = memberIncomes
    .filter((i) => i.income_type === 'Other')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalIncome = grossIncome + otherIncome;
  const totalTaxes = memberTaxes.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = memberExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  // Net income = Gross Income - Taxes + Other Income
  const netIncome = grossIncome - totalTaxes + otherIncome;
  const remainingBalance = netIncome - totalExpenses;

  return {
    member,
    grossIncome,
    otherIncome,
    totalIncome,
    totalTaxes,
    netIncome,
    totalExpenses,
    remainingBalance,
  };
}

/** Calculate household summary */
function calculateHouseholdSummary(
  incomes: Income[],
  taxes: Tax[],
  expenses: Expense[]
): HouseholdSummary {
  const nikkieSummary = calculateMemberSummary('Nikkie', incomes, taxes, expenses);
  const heinSummary = calculateMemberSummary('Hein', incomes, taxes, expenses);

  const grossIncome = nikkieSummary.grossIncome + heinSummary.grossIncome;
  const otherIncome = nikkieSummary.otherIncome + heinSummary.otherIncome;
  const totalIncome = nikkieSummary.totalIncome + heinSummary.totalIncome;
  const totalTaxes = nikkieSummary.totalTaxes + heinSummary.totalTaxes;
  const totalExpenses = nikkieSummary.totalExpenses + heinSummary.totalExpenses;
  const netIncome = grossIncome - totalTaxes + otherIncome;
  const remainingBalance = netIncome - totalExpenses;

  return {
    grossIncome,
    otherIncome,
    totalIncome,
    totalTaxes,
    netIncome,
    totalExpenses,
    remainingBalance,
    nikkieSummary,
    heinSummary,
  };
}


/** Custom hook for budget data management */
export function useBudget(selectedMonth: string) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch all data for the selected month */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [incomesResult, taxesResult, expensesResult] = await Promise.all([
        supabase
          .from(TABLES.INCOMES)
          .select('*')
          .eq('month', selectedMonth)
          .order('created_at', { ascending: false }),
        supabase
          .from(TABLES.TAXES)
          .select('*')
          .eq('month', selectedMonth)
          .order('created_at', { ascending: false }),
        supabase
          .from(TABLES.EXPENSES)
          .select('*')
          .eq('month', selectedMonth)
          .order('created_at', { ascending: false }),
      ]);

      if (incomesResult.error) throw incomesResult.error;
      if (taxesResult.error) throw taxesResult.error;
      if (expensesResult.error) throw expensesResult.error;

      setIncomes(incomesResult.data || []);
      setTaxes(taxesResult.data || []);
      setExpenses(expensesResult.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
      console.error('Error fetching budget data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Add income */
  const addIncome = async (data: IncomeFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.INCOMES).insert({
        ...data,
        month: selectedMonth,
      });
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error adding income:', err);
      return false;
    }
  };

  /** Delete income */
  const deleteIncome = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.INCOMES).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error deleting income:', err);
      return false;
    }
  };

  /** Update income */
  const updateIncome = async (id: string, data: IncomeFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.INCOMES).update(data).eq('id', id);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error updating income:', err);
      return false;
    }
  };

  /** Add tax */
  const addTax = async (data: TaxFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.TAXES).insert({
        ...data,
        month: selectedMonth,
      });
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error adding tax:', err);
      return false;
    }
  };

  /** Delete tax */
  const deleteTax = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.TAXES).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error deleting tax:', err);
      return false;
    }
  };

  /** Update tax */
  const updateTax = async (id: string, data: TaxFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.TAXES).update(data).eq('id', id);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error updating tax:', err);
      return false;
    }
  };

  /** Add expense */
  const addExpense = async (data: ExpenseFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.EXPENSES).insert({
        ...data,
        month: selectedMonth,
      });
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error adding expense:', err);
      return false;
    }
  };

  /** Delete expense */
  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.EXPENSES).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error deleting expense:', err);
      return false;
    }
  };

  /** Update expense */
  const updateExpense = async (id: string, data: ExpenseFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.EXPENSES).update(data).eq('id', id);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error updating expense:', err);
      return false;
    }
  };

  /** Get expense summary by category */
  const getExpensesByCategory = (member?: FamilyMember) => {
    const filtered = member ? expenses.filter((e) => e.member === member) : expenses;
    const byCategory: Record<string, number> = {};

    filtered.forEach((expense) => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + Number(expense.amount);
    });

    return byCategory;
  };

  const summary = calculateHouseholdSummary(incomes, taxes, expenses);

  return {
    incomes,
    taxes,
    expenses,
    loading,
    error,
    summary,
    addIncome,
    deleteIncome,
    updateIncome,
    addTax,
    deleteTax,
    updateTax,
    addExpense,
    deleteExpense,
    updateExpense,
    getExpensesByCategory,
    refetch: fetchData,
  };
}
