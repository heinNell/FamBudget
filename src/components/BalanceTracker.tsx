import { useState } from 'react';
import {
    calculateCurrentBalance,
    getBalanceMonthOptions,
    getCurrentBalanceMonth
} from '../hooks/useBalances';
import type { BalanceAccount, BalanceAccountFormData, Expense } from '../types/budget';

/** Format currency in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface BalanceTrackerProps {
  accounts: BalanceAccount[];
  paidExpenses: Expense[]; // Expenses marked as paid with balance_account_id
  onAdd: (data: BalanceAccountFormData) => Promise<void>;
  onUpdate: (id: string, data: Partial<BalanceAccountFormData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function BalanceTracker({ accounts, paidExpenses, onAdd, onUpdate, onDelete }: BalanceTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedViewMonth, setSelectedViewMonth] = useState(getCurrentBalanceMonth());
  
  const [formData, setFormData] = useState<BalanceAccountFormData>({
    name: '',
    description: '',
    initial_balance: 0,
    monthly_deduction: 0,
    start_month: '2025-12', // Default to December 2025
  });

  const monthOptions = getBalanceMonthOptions();

  // Calculate total paid for an account from expenses
  const getTotalPaidForAccount = (accountId: string): number => {
    return paidExpenses
      .filter(e => e.balance_account_id === accountId && e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  // Calculate total paid for an account up to a specific month
  const getTotalPaidUpToMonth = (accountId: string, upToMonth: string): number => {
    return paidExpenses
      .filter(e => e.balance_account_id === accountId && e.is_paid && e.month <= upToMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  // Get paid expenses for an account grouped by month
  const getPaidExpensesByMonth = (accountId: string): Record<string, Expense[]> => {
    const grouped: Record<string, Expense[]> = {};
    paidExpenses
      .filter(e => e.balance_account_id === accountId && e.is_paid)
      .forEach(e => {
        if (!grouped[e.month]) grouped[e.month] = [];
        grouped[e.month].push(e);
      });
    return grouped;
  };

  // Calculate actual balance based on paid expenses
  const getActualBalanceForMonth = (account: BalanceAccount, month: string): number => {
    const totalPaid = getTotalPaidUpToMonth(account.id, month);
    return Math.max(0, account.initial_balance - totalPaid);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      initial_balance: 0,
      monthly_deduction: 0,
      start_month: '2025-12',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await onUpdate(editingId, formData);
      } else {
        await onAdd(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account: BalanceAccount) => {
    setFormData({
      name: account.name,
      description: account.description,
      initial_balance: account.initial_balance,
      monthly_deduction: account.monthly_deduction,
      start_month: account.start_month,
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this balance account?')) {
      await onDelete(id);
    }
  };

  // Calculate months remaining until balance is zero
  const getMonthsRemaining = (account: BalanceAccount): number => {
    if (account.monthly_deduction <= 0) return Infinity;
    const currentBalance = calculateCurrentBalance(
      account.initial_balance,
      account.monthly_deduction,
      account.start_month,
      selectedViewMonth
    );
    return Math.ceil(currentBalance / account.monthly_deduction);
  };

  // Calculate balance for a specific month
  const getBalanceForMonth = (account: BalanceAccount, month: string): number => {
    return calculateCurrentBalance(
      account.initial_balance,
      account.monthly_deduction,
      account.start_month,
      month
    );
  };

  return (
    <div className="section balance-tracker">
      <div className="section-header">
        <h2>Balance Tracker</h2>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Balance Account'}
        </button>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Account Name (e.g., Car Loan)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Initial Balance (R)</label>
              <input
                type="number"
                placeholder="Initial Balance"
                value={formData.initial_balance || ''}
                onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Monthly Deduction (R)</label>
              <input
                type="number"
                placeholder="Monthly Deduction"
                value={formData.monthly_deduction || ''}
                onChange={(e) => setFormData({ ...formData, monthly_deduction: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Start Month</label>
              <select
                value={formData.start_month}
                onChange={(e) => setFormData({ ...formData, start_month: e.target.value })}
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Account'}
            </button>
          </div>
        </form>
      )}

      <div className="balance-view-selector">
        <label>View balances as of:</label>
        <select
          value={selectedViewMonth}
          onChange={(e) => setSelectedViewMonth(e.target.value)}
        >
          {monthOptions.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      {accounts.length === 0 ? (
        <div className="no-entries">
          <p>No balance accounts yet. Add your first account to start tracking!</p>
        </div>
      ) : (
        <div className="balance-accounts-grid">
          {accounts.map((account) => {
            const projectedBalance = getBalanceForMonth(account, selectedViewMonth);
            const actualBalance = getActualBalanceForMonth(account, selectedViewMonth);
            const totalPaid = getTotalPaidForAccount(account.id);
            const monthsRemaining = getMonthsRemaining(account);
            const progressPercentage = ((account.initial_balance - actualBalance) / account.initial_balance) * 100;
            const paidByMonth = getPaidExpensesByMonth(account.id);
            
            return (
              <div key={account.id} className="balance-account-card">
                <div className="balance-account-header">
                  <h3>{account.name}</h3>
                  <div className="balance-account-actions">
                    <button 
                      className="btn-edit" 
                      onClick={() => handleEdit(account)}
                      title="Edit"
                    >
                      <span className="btn-icon-text">Edit</span>
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(account.id)}
                      title="Delete"
                    >
                      <span className="btn-icon-text">Delete</span>
                    </button>
                  </div>
                </div>
                
                {account.description && (
                  <p className="balance-account-description">{account.description}</p>
                )}
                
                <div className="balance-details">
                  <div className="balance-row">
                    <span className="balance-label">Initial Balance:</span>
                    <span className="balance-value">{formatCurrency(account.initial_balance)}</span>
                  </div>
                  <div className="balance-row">
                    <span className="balance-label">Monthly Deduction:</span>
                    <span className="balance-value deduction">{formatCurrency(account.monthly_deduction)}</span>
                  </div>
                  <div className="balance-row">
                    <span className="balance-label">Start Month:</span>
                    <span className="balance-value">
                      {new Date(account.start_month + '-01').toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="balance-row">
                    <span className="balance-label">Total Paid:</span>
                    <span className="balance-value paid">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="balance-row">
                    <span className="balance-label">Projected Balance:</span>
                    <span className={`balance-value ${projectedBalance <= 0 ? 'paid-off' : ''}`}>
                      {formatCurrency(projectedBalance)}
                    </span>
                  </div>
                  <div className="balance-row highlight">
                    <span className="balance-label">Actual Balance:</span>
                    <span className={`balance-value ${actualBalance <= 0 ? 'paid-off' : ''}`}>
                      {formatCurrency(actualBalance)}
                    </span>
                  </div>
                  {actualBalance > 0 && monthsRemaining !== Infinity && (
                    <div className="balance-row">
                      <span className="balance-label">Est. Months Remaining:</span>
                      <span className="balance-value">{monthsRemaining}</span>
                    </div>
                  )}
                </div>

                <div className="balance-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {progressPercentage.toFixed(1)}% paid off
                  </span>
                </div>

                {/* Payment History */}
                {Object.keys(paidByMonth).length > 0 && (
                  <div className="payment-history">
                    <h4>Payment History</h4>
                    <div className="payment-list">
                      {Object.entries(paidByMonth)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([month, monthExpenses]) => (
                          <div key={month} className="payment-month">
                            <span className="payment-month-label">
                              {new Date(month + '-01').toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                            {monthExpenses.map(exp => (
                              <div key={exp.id} className="payment-item">
                                <span className="payment-desc">{exp.description}</span>
                                <span className="payment-amount">{formatCurrency(Number(exp.amount))}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly Projection Table */}
      {accounts.length > 0 && (
        <div className="balance-projection">
          <h3>Monthly Balance Projection</h3>
          <p className="projection-subtitle">Based on actual payments vs scheduled deductions</p>
          
          {/* Mobile Cards View */}
          <div className="projection-cards-mobile">
            {monthOptions.slice(0, 6).map((month) => (
              <div 
                key={month.value} 
                className={`projection-card ${month.value === getCurrentBalanceMonth() ? 'current' : ''}`}
              >
                <div className="projection-card-header">{month.label}</div>
                <div className="projection-card-accounts">
                  {accounts.map((account) => {
                    const actualBalance = getActualBalanceForMonth(account, month.value);
                    const projectedBalance = getBalanceForMonth(account, month.value);
                    const diff = projectedBalance - actualBalance;
                    return (
                      <div key={account.id} className="projection-card-row">
                        <span className="projection-account-name">{account.name}</span>
                        <div className="projection-balances">
                          <span className={`projection-actual ${actualBalance <= 0 ? 'paid-off' : ''}`}>
                            {formatCurrency(actualBalance)}
                          </span>
                          {diff !== 0 && (
                            <span className={`projection-diff ${diff > 0 ? 'behind' : 'ahead'}`}>
                              {diff > 0 ? '↓' : '↑'} {formatCurrency(Math.abs(diff))}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="projection-table-wrapper">
            <table className="projection-table">
              <thead>
                <tr>
                  <th>Month</th>
                  {accounts.map((account) => (
                    <th key={account.id}>{account.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthOptions.map((month) => (
                  <tr key={month.value} className={month.value === getCurrentBalanceMonth() ? 'current-month' : ''}>
                    <td>{month.label}</td>
                    {accounts.map((account) => {
                      const actualBalance = getActualBalanceForMonth(account, month.value);
                      const projectedBalance = getBalanceForMonth(account, month.value);
                      const diff = projectedBalance - actualBalance;
                      return (
                        <td key={account.id} className={actualBalance <= 0 ? 'paid-off' : ''}>
                          <div className="projection-cell">
                            <span className="actual-balance">{formatCurrency(actualBalance)}</span>
                            {diff !== 0 && (
                              <span className={`projection-diff ${diff > 0 ? 'behind' : 'ahead'}`}>
                                {diff > 0 ? '↓' : '↑'} {formatCurrency(Math.abs(diff))}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
