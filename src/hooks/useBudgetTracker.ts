import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
    BudgetEntry,
    BudgetEntryFormData,
    BudgetExpense,
    BudgetExpenseFormData,
    BudgetWithExpenses,
} from '../types/budget';

const BUDGET_ENTRIES_TABLE = 'budget_entries';
const BUDGET_EXPENSES_TABLE = 'budget_expenses';

/** Custom hook for budget tracker management */
export function useBudgetTracker(selectedMonth: string) {
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [budgetExpenses, setBudgetExpenses] = useState<Record<string, BudgetExpense[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch budget entries for selected month */
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from(BUDGET_ENTRIES_TABLE)
        .select('*')
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setBudgets(data || []);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
    }
  }, [selectedMonth]);

  /** Fetch expenses for all budgets */
  const fetchBudgetExpenses = useCallback(async (budgetIds: string[]) => {
    if (budgetIds.length === 0) {
      setBudgetExpenses({});
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from(BUDGET_EXPENSES_TABLE)
        .select('*')
        .in('budget_id', budgetIds)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      // Group expenses by budget_id
      const grouped = (data || []).reduce((acc, expense) => {
        if (!acc[expense.budget_id]) {
          acc[expense.budget_id] = [];
        }
        acc[expense.budget_id].push(expense);
        return acc;
      }, {} as Record<string, BudgetExpense[]>);

      setBudgetExpenses(grouped);
    } catch (err) {
      console.error('Error fetching budget expenses:', err);
    }
  }, []);

  /** Load data when component mounts or month changes */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await fetchBudgets();
      setLoading(false);
    };
    loadData();
  }, [fetchBudgets, selectedMonth]);

  /** Fetch expenses when budgets change */
  useEffect(() => {
    const budgetIds = budgets.map((b) => b.id);
    if (budgetIds.length > 0) {
      fetchBudgetExpenses(budgetIds);
    } else {
      setBudgetExpenses({});
    }
  }, [budgets, fetchBudgetExpenses]);

  /** Add a new budget entry */
  const addBudget = async (data: BudgetEntryFormData): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase.from(BUDGET_ENTRIES_TABLE).insert({
        ...data,
        month: selectedMonth,
      });

      if (insertError) throw insertError;
      await fetchBudgets();
      return true;
    } catch (err) {
      console.error('Error adding budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to add budget');
      return false;
    }
  };

  /** Update an existing budget entry */
  const updateBudget = async (id: string, data: BudgetEntryFormData): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from(BUDGET_ENTRIES_TABLE)
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchBudgets();
      return true;
    } catch (err) {
      console.error('Error updating budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to update budget');
      return false;
    }
  };

  /** Delete a budget entry */
  const deleteBudget = async (id: string): Promise<boolean> => {
    try {
      // First delete all expenses associated with this budget
      const { error: deleteExpensesError } = await supabase
        .from(BUDGET_EXPENSES_TABLE)
        .delete()
        .eq('budget_id', id);

      if (deleteExpensesError) throw deleteExpensesError;

      // Then delete the budget
      const { error: deleteError } = await supabase
        .from(BUDGET_ENTRIES_TABLE)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchBudgets();
      return true;
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete budget');
      return false;
    }
  };

  /** Add an expense to a budget */
  const addBudgetExpense = async (budgetId: string, data: BudgetExpenseFormData): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase.from(BUDGET_EXPENSES_TABLE).insert({
        budget_id: budgetId,
        ...data,
      });

      if (insertError) throw insertError;
      
      // Refresh expenses for this budget
      const budgetIds = budgets.map((b) => b.id);
      await fetchBudgetExpenses(budgetIds);
      return true;
    } catch (err) {
      console.error('Error adding budget expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to add expense');
      return false;
    }
  };

  /** Update a budget expense */
  const updateBudgetExpense = async (
    id: string,
    data: BudgetExpenseFormData
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from(BUDGET_EXPENSES_TABLE)
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Refresh expenses
      const budgetIds = budgets.map((b) => b.id);
      await fetchBudgetExpenses(budgetIds);
      return true;
    } catch (err) {
      console.error('Error updating budget expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to update expense');
      return false;
    }
  };

  /** Delete a budget expense */
  const deleteBudgetExpense = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from(BUDGET_EXPENSES_TABLE)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Refresh expenses
      const budgetIds = budgets.map((b) => b.id);
      await fetchBudgetExpenses(budgetIds);
      return true;
    } catch (err) {
      console.error('Error deleting budget expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
      return false;
    }
  };

  /** Get budget with expenses and calculations */
  const getBudgetWithExpenses = useCallback(
    (budgetId: string): BudgetWithExpenses | null => {
      const budget = budgets.find((b) => b.id === budgetId);
      if (!budget) return null;

      const expenses = budgetExpenses[budgetId] || [];
      const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const remainingBalance = Number(budget.budget_amount) - totalSpent;
      const percentageUsed = budget.budget_amount > 0 
        ? (totalSpent / Number(budget.budget_amount)) * 100 
        : 0;

      return {
        budget,
        expenses,
        totalSpent,
        remainingBalance,
        percentageUsed,
      };
    },
    [budgets, budgetExpenses]
  );

  /** Get all budgets with their expenses */
  const getAllBudgetsWithExpenses = useCallback((): BudgetWithExpenses[] => {
    return budgets.map((budget) => {
      const expenses = budgetExpenses[budget.id] || [];
      const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const remainingBalance = Number(budget.budget_amount) - totalSpent;
      const percentageUsed = budget.budget_amount > 0 
        ? (totalSpent / Number(budget.budget_amount)) * 100 
        : 0;

      return {
        budget,
        expenses,
        totalSpent,
        remainingBalance,
        percentageUsed,
      };
    });
  }, [budgets, budgetExpenses]);

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    addBudgetExpense,
    updateBudgetExpense,
    deleteBudgetExpense,
    getBudgetWithExpenses,
    getAllBudgetsWithExpenses,
  };
}
