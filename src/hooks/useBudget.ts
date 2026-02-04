import { useCallback, useEffect, useRef, useState } from 'react';
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
    UnnecessaryExpense,
    UnnecessaryExpenseFormData,
} from '../types/budget';

/** Get previous month in YYYY-MM format */
export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

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
  expenses: Expense[],
  unnecessaryExpenses: UnnecessaryExpense[]
): MemberSummary {
  const memberIncomes = incomes.filter((i) => i.member === member);
  const memberTaxes = taxes.filter((t) => t.member === member);
  const memberExpenses = expenses.filter((e) => e.member === member);
  const memberUnnecessaryExpenses = unnecessaryExpenses.filter((u) => u.member === member);

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
  const totalUnnecessaryExpenses = memberUnnecessaryExpenses.reduce((sum, u) => sum + Number(u.amount), 0);
  // Net income = Gross Income - Taxes + Other Income
  const netIncome = grossIncome - totalTaxes + otherIncome;
  const remainingBalance = netIncome - totalExpenses - totalUnnecessaryExpenses;

  return {
    member,
    grossIncome,
    otherIncome,
    totalIncome,
    totalTaxes,
    netIncome,
    totalExpenses,
    totalUnnecessaryExpenses,
    remainingBalance,
  };
}

/** Calculate household summary */
function calculateHouseholdSummary(
  incomes: Income[],
  taxes: Tax[],
  expenses: Expense[],
  unnecessaryExpenses: UnnecessaryExpense[]
): HouseholdSummary {
  const nikkieSummary = calculateMemberSummary('Nikkie', incomes, taxes, expenses, unnecessaryExpenses);
  const heinSummary = calculateMemberSummary('Hein', incomes, taxes, expenses, unnecessaryExpenses);

  const grossIncome = nikkieSummary.grossIncome + heinSummary.grossIncome;
  const otherIncome = nikkieSummary.otherIncome + heinSummary.otherIncome;
  const totalIncome = nikkieSummary.totalIncome + heinSummary.totalIncome;
  const totalTaxes = nikkieSummary.totalTaxes + heinSummary.totalTaxes;
  const totalExpenses = nikkieSummary.totalExpenses + heinSummary.totalExpenses;
  const totalUnnecessaryExpenses = nikkieSummary.totalUnnecessaryExpenses + heinSummary.totalUnnecessaryExpenses;
  const netIncome = grossIncome - totalTaxes + otherIncome;
  const remainingBalance = netIncome - totalExpenses - totalUnnecessaryExpenses;

  return {
    grossIncome,
    otherIncome,
    totalIncome,
    totalTaxes,
    netIncome,
    totalExpenses,
    totalUnnecessaryExpenses,
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
  const [unnecessaryExpenses, setUnnecessaryExpenses] = useState<UnnecessaryExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCarryingOver, setIsCarryingOver] = useState(false);
  
  // Track which months have been auto-carried over to prevent duplicate carries
  const carriedOverMonths = useRef<Set<string>>(new Set());

  /** Fetch all data for the selected month */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [incomesResult, taxesResult, expensesResult, unnecessaryExpensesResult] = await Promise.all([
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
        supabase
          .from(TABLES.UNNECESSARY_EXPENSES)
          .select('*')
          .eq('month', selectedMonth)
          .order('created_at', { ascending: false }),
      ]);

      if (incomesResult.error) throw incomesResult.error;
      if (taxesResult.error) throw taxesResult.error;
      if (expensesResult.error) throw expensesResult.error;
      // Don't throw for unnecessary expenses - table might not exist yet
      if (unnecessaryExpensesResult.error && !unnecessaryExpensesResult.error.message.includes('does not exist')) {
        throw unnecessaryExpensesResult.error;
      }

      const fetchedIncomes = incomesResult.data || [];
      const fetchedTaxes = taxesResult.data || [];
      const fetchedExpenses = expensesResult.data || [];
      const fetchedUnnecessaryExpenses = unnecessaryExpensesResult.data || [];

      setIncomes(fetchedIncomes);
      setTaxes(fetchedTaxes);
      setExpenses(fetchedExpenses);
      setUnnecessaryExpenses(fetchedUnnecessaryExpenses);

      // Auto carry-forward if current month has no data and we haven't already carried over
      if (
        fetchedIncomes.length === 0 &&
        fetchedTaxes.length === 0 &&
        fetchedExpenses.length === 0 &&
        !carriedOverMonths.current.has(selectedMonth)
      ) {
        // Mark as carried over before starting to prevent race conditions
        carriedOverMonths.current.add(selectedMonth);
        await autoCarryForwardFromPreviousMonth();
      }
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

  /** Auto carry forward all data from previous month */
  const autoCarryForwardFromPreviousMonth = async (): Promise<boolean> => {
    setIsCarryingOver(true);
    try {
      const previousMonth = getPreviousMonth(selectedMonth);

      // Fetch all data from previous month
      const [incomesResult, taxesResult, expensesResult] = await Promise.all([
        supabase
          .from(TABLES.INCOMES)
          .select('*')
          .eq('month', previousMonth)
          .order('created_at', { ascending: true }),
        supabase
          .from(TABLES.TAXES)
          .select('*')
          .eq('month', previousMonth)
          .order('created_at', { ascending: true }),
        supabase
          .from(TABLES.EXPENSES)
          .select('*')
          .eq('month', previousMonth)
          .order('created_at', { ascending: true }),
      ]);

      if (incomesResult.error) throw incomesResult.error;
      if (taxesResult.error) throw taxesResult.error;
      if (expensesResult.error) throw expensesResult.error;

      const prevIncomes = incomesResult.data || [];
      const prevTaxes = taxesResult.data || [];
      const prevExpenses = expensesResult.data || [];

      // If no previous data, nothing to carry forward
      if (prevIncomes.length === 0 && prevTaxes.length === 0 && prevExpenses.length === 0) {
        return true;
      }

      // Create new records for current month
      const newIncomes = prevIncomes.map((income) => ({
        member: income.member,
        income_type: income.income_type,
        description: income.description,
        amount: income.amount,
        month: selectedMonth,
      }));

      const newTaxes = prevTaxes.map((tax) => ({
        member: tax.member,
        description: tax.description,
        amount: tax.amount,
        month: selectedMonth,
      }));

      const newExpenses = prevExpenses.map((expense) => ({
        member: expense.member,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        is_shared: expense.is_shared,
        is_recurring: expense.is_recurring,
        is_paid: expense.is_paid,
        include_vat: expense.include_vat,
        note: expense.note,
        balance_account_id: expense.balance_account_id,
        month: selectedMonth,
      }));

      // Insert all new records
      if (newIncomes.length > 0) {
        const { error: incomeError } = await supabase.from(TABLES.INCOMES).insert(newIncomes);
        if (incomeError) throw incomeError;
      }
      if (newTaxes.length > 0) {
        const { error: taxError } = await supabase.from(TABLES.TAXES).insert(newTaxes);
        if (taxError) throw taxError;
      }
      if (newExpenses.length > 0) {
        const { error: expenseError } = await supabase.from(TABLES.EXPENSES).insert(newExpenses);
        if (expenseError) throw expenseError;
      }

      // Refresh data after carry over
      await fetchDataWithoutAutoCarry();
      return true;
    } catch (err) {
      console.error('Error auto carrying over from previous month:', err);
      // Remove from carried over set so user can retry
      carriedOverMonths.current.delete(selectedMonth);
      return false;
    } finally {
      setIsCarryingOver(false);
    }
  };

  /** Fetch data without triggering auto carry-forward */
  const fetchDataWithoutAutoCarry = async () => {
    try {
      const [incomesResult, taxesResult, expensesResult, unnecessaryExpensesResult] = await Promise.all([
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
        supabase
          .from(TABLES.UNNECESSARY_EXPENSES)
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
      setUnnecessaryExpenses(unnecessaryExpensesResult.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

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

  /** Fetch expenses from previous month */
  const fetchPreviousMonthExpenses = async (): Promise<Expense[]> => {
    try {
      const previousMonth = getPreviousMonth(selectedMonth);

      const { data, error: fetchError } = await supabase
        .from(TABLES.EXPENSES)
        .select('*')
        .eq('month', previousMonth)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching previous month expenses:', err);
      return [];
    }
  };

  /** Fetch incomes from previous month */
  const fetchPreviousMonthIncomes = async (): Promise<Income[]> => {
    try {
      const previousMonth = getPreviousMonth(selectedMonth);

      const { data, error: fetchError } = await supabase
        .from(TABLES.INCOMES)
        .select('*')
        .eq('month', previousMonth)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching previous month incomes:', err);
      return [];
    }
  };

  /** Fetch taxes from previous month */
  const fetchPreviousMonthTaxes = async (): Promise<Tax[]> => {
    try {
      const previousMonth = getPreviousMonth(selectedMonth);

      const { data, error: fetchError } = await supabase
        .from(TABLES.TAXES)
        .select('*')
        .eq('month', previousMonth)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching previous month taxes:', err);
      return [];
    }
  };

  /** Carry over expenses from previous month */
  const carryOverExpenses = async (expensesToCarry: Expense[]): Promise<boolean> => {
    try {
      // Create new expenses for current month without id and created_at
      const newExpenses = expensesToCarry.map((expense) => ({
        member: expense.member,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        month: selectedMonth,
      }));

      const { error } = await supabase.from(TABLES.EXPENSES).insert(newExpenses);
      if (error) throw error;
      await fetchDataWithoutAutoCarry();
      return true;
    } catch (err) {
      console.error('Error carrying over expenses:', err);
      return false;
    }
  };

  /** Carry over incomes from previous month */
  const carryOverIncomes = async (incomesToCarry: Income[]): Promise<boolean> => {
    try {
      const newIncomes = incomesToCarry.map((income) => ({
        member: income.member,
        income_type: income.income_type,
        description: income.description,
        amount: income.amount,
        month: selectedMonth,
      }));

      const { error } = await supabase.from(TABLES.INCOMES).insert(newIncomes);
      if (error) throw error;
      await fetchDataWithoutAutoCarry();
      return true;
    } catch (err) {
      console.error('Error carrying over incomes:', err);
      return false;
    }
  };

  /** Carry over taxes from previous month */
  const carryOverTaxes = async (taxesToCarry: Tax[]): Promise<boolean> => {
    try {
      const newTaxes = taxesToCarry.map((tax) => ({
        member: tax.member,
        description: tax.description,
        amount: tax.amount,
        month: selectedMonth,
      }));

      const { error } = await supabase.from(TABLES.TAXES).insert(newTaxes);
      if (error) throw error;
      await fetchDataWithoutAutoCarry();
      return true;
    } catch (err) {
      console.error('Error carrying over taxes:', err);
      return false;
    }
  };

  /** Add unnecessary expense */
  const addUnnecessaryExpense = async (data: UnnecessaryExpenseFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.UNNECESSARY_EXPENSES).insert({
        ...data,
        month: selectedMonth,
      });
      if (error) throw error;
      await fetchDataWithoutAutoCarry();
      return true;
    } catch (err) {
      console.error('Error adding unnecessary expense:', err);
      return false;
    }
  };

  /** Delete unnecessary expense */
  const deleteUnnecessaryExpense = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.UNNECESSARY_EXPENSES).delete().eq('id', id);
      if (error) throw error;
      await fetchDataWithoutAutoCarry();
      return true;
    } catch (err) {
      console.error('Error deleting unnecessary expense:', err);
      return false;
    }
  };

  /** Update unnecessary expense */
  const updateUnnecessaryExpense = async (id: string, data: UnnecessaryExpenseFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.UNNECESSARY_EXPENSES).update(data).eq('id', id);
      if (error) throw error;
      await fetchDataWithoutAutoCarry();
      return true;
    } catch (err) {
      console.error('Error updating unnecessary expense:', err);
      return false;
    }
  };

  const summary = calculateHouseholdSummary(incomes, taxes, expenses, unnecessaryExpenses);

  return {
    incomes,
    taxes,
    expenses,
    unnecessaryExpenses,
    loading,
    error,
    isCarryingOver,
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
    addUnnecessaryExpense,
    deleteUnnecessaryExpense,
    updateUnnecessaryExpense,
    getExpensesByCategory,
    fetchPreviousMonthExpenses,
    fetchPreviousMonthIncomes,
    fetchPreviousMonthTaxes,
    carryOverExpenses,
    carryOverIncomes,
    carryOverTaxes,
    refetch: fetchData,
  };
}
