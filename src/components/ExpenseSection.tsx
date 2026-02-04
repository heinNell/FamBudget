import { useState } from 'react';
import type { BalanceAccount, Expense, ExpenseCategory, ExpenseFormData, FamilyMember } from '../types/budget';
import { VAT_RATE } from '../types/budget';

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

const CATEGORY_LABELS: Record<ExpenseCategory, { abbr: string; color: string }> = {
  Housing: { abbr: 'HSG', color: '#6366f1' },
  Utilities: { abbr: 'UTL', color: '#8b5cf6' },
  Groceries: { abbr: 'GRC', color: '#22c55e' },
  Transportation: { abbr: 'TRN', color: '#f59e0b' },
  Healthcare: { abbr: 'HLT', color: '#ef4444' },
  Entertainment: { abbr: 'ENT', color: '#ec4899' },
  Dining: { abbr: 'DIN', color: '#f97316' },
  Shopping: { abbr: 'SHP', color: '#14b8a6' },
  Education: { abbr: 'EDU', color: '#3b82f6' },
  Insurance: { abbr: 'INS', color: '#64748b' },
  Savings: { abbr: 'SAV', color: '#10b981' },
  Other: { abbr: 'OTH', color: '#94a3b8' },
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [includeVat, setIncludeVat] = useState(false);
  const [note, setNote] = useState('');
  const [balanceAccountId, setBalanceAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Calculate VAT amount from base price */
  const calculateVatAmount = (baseAmount: number): number => {
    return baseAmount * VAT_RATE;
  };

  /** Calculate total amount with VAT */
  const calculateTotalWithVat = (baseAmount: number): number => {
    return baseAmount + calculateVatAmount(baseAmount);
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setIsShared(false);
    setIsRecurring(false);
    setIsPaid(false);
    setIncludeVat(false);
    setNote('');
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
      is_recurring: isRecurring,
      is_paid: isPaid,
      include_vat: includeVat,
      note: note.trim() || null,
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
    setIsRecurring(expense.is_recurring);
    setIsPaid(expense.is_paid);
    setIncludeVat(expense.include_vat);
    setNote(expense.note || '');
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

  // Quick toggle for paid status
  const handleTogglePaid = async (expense: Expense) => {
    const data: ExpenseFormData = {
      member: expense.member,
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      is_shared: expense.is_shared,
      is_recurring: expense.is_recurring,
      is_paid: !expense.is_paid,
      include_vat: expense.include_vat,
      note: expense.note,
      balance_account_id: expense.balance_account_id,
    };
    await onUpdate(expense.id, data);
  };

  // Inline note update - update when user finishes editing
  const handleNoteUpdate = async (expense: Expense, newNote: string) => {
    // Only update if note actually changed
    if (expense.note === newNote || (!expense.note && !newNote)) return;
    
    const data: ExpenseFormData = {
      member: expense.member,
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      is_shared: expense.is_shared,
      is_recurring: expense.is_recurring,
      is_paid: expense.is_paid,
      include_vat: expense.include_vat,
      note: newNote.trim() || null,
      balance_account_id: expense.balance_account_id,
    };
    await onUpdate(expense.id, data);
  };

  const nikkieExpenses = expenses.filter((e) => e.member === 'Nikkie');
  const heinExpenses = expenses.filter((e) => e.member === 'Hein');

  return (
    <div className="section expense-section">
      <div className="section-header">
        <h2>Expenses</h2>
        <button className="btn-add" onClick={() => { resetForm(); setIsAdding(!isAdding); }}>
          {isAdding ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {isAdding && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <span className="form-title">{editingId ? 'Edit Expense' : 'New Expense'}</span>
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
                  {cat}
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
            <label className="shared-checkbox">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              Recurring
            </label>
            <label className="shared-checkbox paid-checkbox">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
              />
              Paid
            </label>
            <label className="shared-checkbox vat-checkbox">
              <input
                type="checkbox"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.target.checked)}
              />
              +VAT (15%)
            </label>
          </div>
          {includeVat && amount && (
            <div className="form-row vat-preview">
              <span className="vat-info">
                Base: {formatCurrency(parseFloat(amount))} + VAT: {formatCurrency(calculateVatAmount(parseFloat(amount)))} = Total: {formatCurrency(calculateTotalWithVat(parseFloat(amount)))}
              </span>
            </div>
          )}
          <div className="form-row">
            <input
              type="text"
              placeholder="Monthly note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="note-input"
            />
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
          <h4>Expenses by Category</h4>
          <div className="category-grid">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amt]) => (
                <div key={cat} className="category-item">
                  <span className="category-name">
                    <span className="category-label" style={{ background: CATEGORY_LABELS[cat as ExpenseCategory].color }}>
                      {CATEGORY_LABELS[cat as ExpenseCategory].abbr}
                    </span>
                    {cat}
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
                <li key={expense.id} className={`entry-item ${expense.is_paid ? 'paid' : ''}`}>
                  <div className="entry-paid-toggle">
                    <input
                      type="checkbox"
                      checked={expense.is_paid}
                      onChange={() => handleTogglePaid(expense)}
                      title={expense.is_paid ? 'Mark as unpaid' : 'Mark as paid'}
                    />
                  </div>
                  <div className="entry-info">
                    <span className="entry-category" style={{ background: CATEGORY_LABELS[expense.category as ExpenseCategory].color }}>
                      {CATEGORY_LABELS[expense.category as ExpenseCategory].abbr}
                    </span>
                    <span className="entry-description">
                      {expense.description}
                      {expense.is_shared && <span className="shared-badge">Shared</span>}
                      {expense.is_recurring && <span className="recurring-badge">Recurring</span>}
                      {expense.is_paid && <span className="paid-badge">Paid</span>}
                      {expense.include_vat && <span className="vat-badge">+VAT</span>}
                      {expense.balance_account_id && (
                        <span className="balance-link-badge">
                          {getBalanceAccountName(expense.balance_account_id)}
                        </span>
                      )}
                    </span>
                    <span className="entry-amount expenses">
                      {expense.include_vat ? (
                        <span className="amount-with-vat">
                          <span className="total-amount">{formatCurrency(calculateTotalWithVat(Number(expense.amount)))}</span>
                          <span className="base-amount">({formatCurrency(Number(expense.amount))} + VAT)</span>
                        </span>
                      ) : (
                        formatCurrency(Number(expense.amount))
                      )}
                    </span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(expense)}
                      title="Edit"
                    >
                      <span className="btn-icon-text">Edit</span>
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(expense.id)}
                      title="Delete"
                    >
                      <span className="btn-icon-text">Delete</span>
                    </button>
                  </div>
                  <div className="entry-note-inline">
                    <input
                      type="text"
                      className="inline-note-input"
                      placeholder="Add a note..."
                      defaultValue={expense.note || ''}
                      onBlur={(e) => handleNoteUpdate(expense, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                    />
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
                <li key={expense.id} className={`entry-item ${expense.is_paid ? 'paid' : ''}`}>
                  <div className="entry-paid-toggle">
                    <input
                      type="checkbox"
                      checked={expense.is_paid}
                      onChange={() => handleTogglePaid(expense)}
                      title={expense.is_paid ? 'Mark as unpaid' : 'Mark as paid'}
                    />
                  </div>
                  <div className="entry-info">
                    <span className="entry-category" style={{ background: CATEGORY_LABELS[expense.category as ExpenseCategory].color }}>
                      {CATEGORY_LABELS[expense.category as ExpenseCategory].abbr}
                    </span>
                    <span className="entry-description">
                      {expense.description}
                      {expense.is_shared && <span className="shared-badge">Shared</span>}
                      {expense.is_recurring && <span className="recurring-badge">Recurring</span>}
                      {expense.is_paid && <span className="paid-badge">Paid</span>}
                      {expense.include_vat && <span className="vat-badge">+VAT</span>}
                      {expense.balance_account_id && (
                        <span className="balance-link-badge">
                          {getBalanceAccountName(expense.balance_account_id)}
                        </span>
                      )}
                    </span>
                    <span className="entry-amount expenses">
                      {expense.include_vat ? (
                        <span className="amount-with-vat">
                          <span className="total-amount">{formatCurrency(calculateTotalWithVat(Number(expense.amount)))}</span>
                          <span className="base-amount">({formatCurrency(Number(expense.amount))} + VAT)</span>
                        </span>
                      ) : (
                        formatCurrency(Number(expense.amount))
                      )}
                    </span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(expense)}
                      title="Edit"
                    >
                      <span className="btn-icon-text">Edit</span>
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(expense.id)}
                      title="Delete"
                    >
                      <span className="btn-icon-text">Delete</span>
                    </button>
                  </div>
                  <div className="entry-note-inline">
                    <input
                      type="text"
                      className="inline-note-input"
                      placeholder="Add a note..."
                      defaultValue={expense.note || ''}
                      onBlur={(e) => handleNoteUpdate(expense, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                    />
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
