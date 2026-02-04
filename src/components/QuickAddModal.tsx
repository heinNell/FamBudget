import { useState } from 'react';
import type {
    BalanceAccount,
    ExpenseCategory,
    ExpenseFormData,
    FamilyMember,
    IncomeFormData,
    IncomeType,
    TaxFormData,
    UnnecessaryExpenseFormData,
} from '../types/budget';
import { VAT_RATE } from '../types/budget';

type EntryType = 'income' | 'tax' | 'expense' | 'unnecessary';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceAccounts: BalanceAccount[];
  onAddIncome: (data: IncomeFormData) => Promise<boolean>;
  onAddTax: (data: TaxFormData) => Promise<boolean>;
  onAddExpense: (data: ExpenseFormData) => Promise<boolean>;
  onAddUnnecessaryExpense: (data: UnnecessaryExpenseFormData) => Promise<boolean>;
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

export function QuickAddModal({
  isOpen,
  onClose,
  balanceAccounts,
  onAddIncome,
  onAddTax,
  onAddExpense,
  onAddUnnecessaryExpense,
}: QuickAddModalProps) {
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [member, setMember] = useState<FamilyMember>('Nikkie');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Income specific
  const [incomeType, setIncomeType] = useState<IncomeType>('Salary');

  // Expense specific
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [isShared, setIsShared] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [includeVat, setIncludeVat] = useState(false);
  const [balanceAccountId, setBalanceAccountId] = useState<string | null>(null);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setMember('Nikkie');
    setIncomeType('Salary');
    setCategory('Groceries');
    setIsShared(false);
    setIsRecurring(false);
    setIsPaid(false);
    setIncludeVat(false);
    setBalanceAccountId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setSubmitting(true);
    let success = false;

    try {
      switch (entryType) {
        case 'income':
          success = await onAddIncome({
            member,
            income_type: incomeType,
            description: description.trim(),
            amount: parseFloat(amount),
          });
          break;
        case 'tax':
          success = await onAddTax({
            member,
            description: description.trim(),
            amount: parseFloat(amount),
          });
          break;
        case 'expense':
          success = await onAddExpense({
            member,
            category,
            description: description.trim(),
            amount: parseFloat(amount),
            is_shared: isShared,
            is_recurring: isRecurring,
            is_paid: isPaid,
            include_vat: includeVat,
            note: null,
            balance_account_id: balanceAccountId,
          });
          break;
        case 'unnecessary':
          success = await onAddUnnecessaryExpense({
            member,
            description: description.trim(),
            amount: parseFloat(amount),
          });
          break;
      }

      if (success) {
        resetForm();
        // Keep modal open for quick consecutive entries
      }
    } finally {
      setSubmitting(false);
    }
  };

  const calculateVatTotal = (baseAmount: number): number => {
    return baseAmount * (1 + VAT_RATE);
  };

  if (!isOpen) return null;

  const typeLabels: Record<EntryType, { label: string; color: string }> = {
    income: { label: 'Income', color: 'var(--color-income)' },
    tax: { label: 'Tax', color: 'var(--color-taxes)' },
    expense: { label: 'Expense', color: 'var(--color-expenses)' },
    unnecessary: { label: 'Discretionary', color: 'var(--color-unnecessary)' },
  };

  return (
    <div className="quick-add-backdrop" onClick={handleClose}>
      <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-add-header">
          <h3>Quick Add</h3>
          <button className="quick-add-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="quick-add-type-selector">
          {(Object.keys(typeLabels) as EntryType[]).map((type) => (
            <button
              key={type}
              className={`type-btn ${entryType === type ? 'active' : ''}`}
              onClick={() => setEntryType(type)}
              style={{ '--type-color': typeLabels[type].color } as React.CSSProperties}
            >
              {typeLabels[type].label}
            </button>
          ))}
        </div>

        <form className="quick-add-form" onSubmit={handleSubmit}>
          <div className="quick-add-row">
            <label>Member</label>
            <div className="member-toggle">
              <button
                type="button"
                className={`member-btn nikkie ${member === 'Nikkie' ? 'active' : ''}`}
                onClick={() => setMember('Nikkie')}
              >
                Nikkie
              </button>
              <button
                type="button"
                className={`member-btn hein ${member === 'Hein' ? 'active' : ''}`}
                onClick={() => setMember('Hein')}
              >
                Hein
              </button>
            </div>
          </div>

          {entryType === 'income' && (
            <div className="quick-add-row">
              <label>Type</label>
              <select value={incomeType} onChange={(e) => setIncomeType(e.target.value as IncomeType)}>
                <option value="Salary">Salary</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {entryType === 'expense' && (
            <div className="quick-add-row">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="quick-add-row">
            <label>Description</label>
            <input
              type="text"
              placeholder="Enter description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="quick-add-row">
            <label>Amount (ZAR)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>

          {entryType === 'expense' && (
            <>
              <div className="quick-add-options">
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                  />
                  <span>Shared</span>
                </label>
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <span>Recurring</span>
                </label>
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                  />
                  <span>Paid</span>
                </label>
                <label className="option-checkbox vat">
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={(e) => setIncludeVat(e.target.checked)}
                  />
                  <span>+VAT (15%)</span>
                </label>
              </div>

              {includeVat && amount && (
                <div className="vat-preview-compact">
                  Total with VAT: <strong>R {calculateVatTotal(parseFloat(amount)).toFixed(2)}</strong>
                </div>
              )}

              {balanceAccounts.length > 0 && (
                <div className="quick-add-row">
                  <label>Link to Balance</label>
                  <select
                    value={balanceAccountId || ''}
                    onChange={(e) => setBalanceAccountId(e.target.value || null)}
                  >
                    <option value="">— None —</option>
                    {balanceAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="quick-add-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
