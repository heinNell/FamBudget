import { useState } from 'react';
import type { BalanceAccount, Expense, ExpenseCategory, ExpenseFormData, FamilyMember } from '../types/budget';

interface ExpenseSectionProps {
  expenses: Expense[];
  balanceAccounts: BalanceAccount[];
  onAdd: (data: ExpenseFormData) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, data: ExpenseFormData) => Promise<boolean>;
  expensesByCategory: Record<string, number>;
}

/** Format currency for display in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Housing',
  'Utilities',
  'Groceries',
  'Transportation',
  'Healthcare',
  'Entertainment',
  'Dining',
  'Shopping',
  'Education',
  'Insurance',
  'Savings',
  'Other',
];

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Housing: '🏠',
  Utilities: '💡',
  Groceries: '🛒',
  Transportation: '🚗',
  Healthcare: '🏥',
  Entertainment: '🎬',
  Dining: '🍽️',
  Shopping: '🛍️',
  Education: '📚',
  Insurance: '🛡️',
  Savings: '💰',
  Other: '📦',
};

export function ExpenseSection({
  expenses,
  balanceAccounts,
  onAdd,
  onDelete,
  onUpdate,
  expensesByCategory,
}: ExpenseSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [member, setMember] = useState<FamilyMember>('Nikkie');
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [balanceAccountId, setBalanceAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setIsShared(false);
    setMember('Nikkie');
    setCategory('Groceries');
    setBalanceAccountId(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setSubmitting(true);
    const data: ExpenseFormData = {
      member,
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      is_shared: isShared,
      balance_account_id: balanceAccountId,
    };

    const success = editingId
      ? await onUpdate(editingId, data)
      : await onAdd(data);

    if (success) {
      resetForm();
    }
    setSubmitting(false);
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setMember(expense.member);
    setCategory(expense.category);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setIsShared(expense.is_shared);
    setBalanceAccountId(expense.balance_account_id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  // Helper to get balance account name by ID
  const getBalanceAccountName = (id: string | null): string | null => {
    if (!id) return null;
    const account = balanceAccounts.find(a => a.id === id);
    return account ? account.name : null;
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await onDelete(id);
    }
  };

  const nikkieExpenses = expenses.filter((e) => e.member === 'Nikkie');
  const heinExpenses = expenses.filter((e) => e.member === 'Hein');

  return (
    <div className="section expense-section">
      <div className="section-header">
        <h2>💸 Expenses</h2>
        <button className="btn-add" onClick={() => { resetForm(); setIsAdding(!isAdding); }}>
          {isAdding ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {isAdding && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <span>{editingId ? '✏️ Edit Expense' : '➕ New Expense'}</span>
            {editingId && (
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel Edit
              </button>
            )}
          </div>
          <div className="form-row">
            <select value={member} onChange={(e) => setMember(e.target.value as FamilyMember)}>
              <option value="Nikkie">Nikkie</option>
              <option value="Hein">Hein</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_ICONS[cat]} {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
            <label className="shared-checkbox">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
              />
              Shared
            </label>
          </div>
          {balanceAccounts.length > 0 && (
            <div className="form-row">
              <div className="balance-link-select">
                <label>Link to Balance Account (optional):</label>
                <select
                  value={balanceAccountId || ''}
                  onChange={(e) => setBalanceAccountId(e.target.value || null)}
                >
                  <option value="">— No linked account —</option>
                  {balanceAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="form-row">
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Category Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="category-breakdown">
          <h4>📊 Expenses by Category</h4>
          <div className="category-grid">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amt]) => (
                <div key={cat} className="category-item">
                  <span className="category-name">
                    {CATEGORY_ICONS[cat as ExpenseCategory]} {cat}
                  </span>
                  <span className="category-amount">{formatCurrency(amt)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="entries-grid">
        <div className="entries-column">
          <h4>Nikkie's Expenses</h4>
          {nikkieExpenses.length === 0 ? (
            <p className="no-entries">No expense entries</p>
          ) : (
            <ul className="entries-list">
              {nikkieExpenses.map((expense) => (
                <li key={expense.id} className="entry-item">
                  <div className="entry-info">
                    <span className="entry-category">
                      {CATEGORY_ICONS[expense.category as ExpenseCategory]}
                    </span>
                    <span className="entry-description">
                      {expense.description}
                      {expense.is_shared && <span className="shared-badge">Shared</span>}
                      {expense.balance_account_id && (
                        <span className="balance-link-badge">
                          🔗 {getBalanceAccountName(expense.balance_account_id)}
                        </span>
                      )}
                    </span>
                    <span className="entry-amount expenses">
                      {formatCurrency(Number(expense.amount))}
                    </span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(expense)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(expense.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="entries-column">
          <h4>Hein's Expenses</h4>
          {heinExpenses.length === 0 ? (
            <p className="no-entries">No expense entries</p>
          ) : (
            <ul className="entries-list">
              {heinExpenses.map((expense) => (
                <li key={expense.id} className="entry-item">
                  <div className="entry-info">
                    <span className="entry-category">
                      {CATEGORY_ICONS[expense.category as ExpenseCategory]}
                    </span>
                    <span className="entry-description">
                      {expense.description}
                      {expense.is_shared && <span className="shared-badge">Shared</span>}
                      {expense.balance_account_id && (
                        <span className="balance-link-badge">
                          🔗 {getBalanceAccountName(expense.balance_account_id)}
                        </span>
                      )}
                    </span>
                    <span className="entry-amount expenses">
                      {formatCurrency(Number(expense.amount))}
                    </span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(expense)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(expense.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
