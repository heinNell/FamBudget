import { useCallback, useEffect, useState } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import type { BalanceAccount, BalanceAccountFormData, BalanceHistory } from '../types/budget';

/** Generate list of months from December 2025 through December 2026 */
export function getBalanceMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  
  // Start from December 2025
  const startDate = new Date(2025, 11, 1); // December 2025
  const endDate = new Date(2026, 11, 1); // December 2026
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const label = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return options;
}

/** Calculate the current balance for an account based on months elapsed */
export function calculateCurrentBalance(
  initialBalance: number,
  monthlyDeduction: number,
  startMonth: string,
  currentMonth: string
): number {
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
  
  const startDate = new Date(startYear, startMonthNum - 1, 1);
  const currentDate = new Date(currentYear, currentMonthNum - 1, 1);
  
  // Calculate months elapsed (including start month)
  const monthsElapsed = 
    (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
    (currentDate.getMonth() - startDate.getMonth());
  
  if (monthsElapsed < 0) {
    return initialBalance; // Haven't started deducting yet
  }
  
  // Deduct for each month including the current one
  const totalDeductions = monthlyDeduction * (monthsElapsed + 1);
  const currentBalance = initialBalance - totalDeductions;
  
  return Math.max(0, currentBalance); // Don't go below zero
}

/** Get the current month in YYYY-MM format */
export function getCurrentBalanceMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface UseBalancesReturn {
  accounts: BalanceAccount[];
  history: BalanceHistory[];
  loading: boolean;
  error: string | null;
  addAccount: (data: BalanceAccountFormData) => Promise<void>;
  updateAccount: (id: string, data: Partial<BalanceAccountFormData>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  refreshBalances: () => Promise<void>;
}

export function useBalances(): UseBalancesReturn {
  const [accounts, setAccounts] = useState<BalanceAccount[]>([]);
  const [history, setHistory] = useState<BalanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch balance accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from(TABLES.BALANCE_ACCOUNTS)
        .select('*')
        .order('name');

      if (accountsError) throw accountsError;

      // Fetch balance history
      const { data: historyData, error: historyError } = await supabase
        .from(TABLES.BALANCE_HISTORY)
        .select('*')
        .order('month', { ascending: false });

      if (historyError) throw historyError;

      // Calculate current balances for each account
      const currentMonth = getCurrentBalanceMonth();
      const accountsWithCurrentBalance = (accountsData || []).map((account: BalanceAccount) => ({
        ...account,
        current_balance: calculateCurrentBalance(
          account.initial_balance,
          account.monthly_deduction,
          account.start_month,
          currentMonth
        ),
      }));

      setAccounts(accountsWithCurrentBalance);
      setHistory(historyData || []);
    } catch (err) {
      console.error('Error fetching balance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load balance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addAccount = useCallback(async (data: BalanceAccountFormData) => {
    const { error } = await supabase.from(TABLES.BALANCE_ACCOUNTS).insert({
      name: data.name,
      description: data.description,
      initial_balance: data.initial_balance,
      current_balance: data.initial_balance, // Initially same as initial
      monthly_deduction: data.monthly_deduction,
      start_month: data.start_month,
    });

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const updateAccount = useCallback(async (id: string, data: Partial<BalanceAccountFormData>) => {
    const { error } = await supabase
      .from(TABLES.BALANCE_ACCOUNTS)
      .update(data)
      .eq('id', id);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const deleteAccount = useCallback(async (id: string) => {
    // First delete related history
    await supabase
      .from(TABLES.BALANCE_HISTORY)
      .delete()
      .eq('account_id', id);

    // Then delete the account
    const { error } = await supabase
      .from(TABLES.BALANCE_ACCOUNTS)
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const refreshBalances = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    accounts,
    history,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    refreshBalances,
  };
}
