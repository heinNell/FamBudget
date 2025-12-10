import { useState } from 'react';
import type { FamilyMember, Income, IncomeFormData, IncomeType } from '../types/budget';

interface IncomeSectionProps {
  incomes: Income[];
  onAdd: (data: IncomeFormData) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, data: IncomeFormData) => Promise<boolean>;
}

/** Format currency for display in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function IncomeSection({ incomes, onAdd, onDelete, onUpdate }: IncomeSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [member, setMember] = useState<FamilyMember>('Nikkie');
  const [incomeType, setIncomeType] = useState<IncomeType>('Salary');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setIncomeType('Salary');
    setMember('Nikkie');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setSubmitting(true);
    const data: IncomeFormData = {
      member,
      income_type: incomeType,
      description: description.trim(),
      amount: parseFloat(amount),
    };

    const success = editingId
      ? await onUpdate(editingId, data)
      : await onAdd(data);

    if (success) {
      resetForm();
    }
    setSubmitting(false);
  };

  const handleEdit = (income: Income) => {
    setEditingId(income.id);
    setMember(income.member);
    setIncomeType(income.income_type);
    setDescription(income.description);
    setAmount(String(income.amount));
    setIsAdding(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this income?')) {
      await onDelete(id);
    }
  };

  const nikkieIncomes = incomes.filter((i) => i.member === 'Nikkie');
  const heinIncomes = incomes.filter((i) => i.member === 'Hein');

  return (
    <div className="section income-section">
      <div className="section-header">
        <h2>💰 Income</h2>
        <button className="btn-add" onClick={() => { resetForm(); setIsAdding(!isAdding); }}>
          {isAdding ? 'Cancel' : '+ Add Income'}
        </button>
      </div>

      {isAdding && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <span>{editingId ? '✏️ Edit Income' : '➕ New Income'}</span>
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
            <select value={incomeType} onChange={(e) => setIncomeType(e.target.value as IncomeType)}>
              <option value="Salary">💼 Salary (Gross)</option>
              <option value="Other">📦 Other Income</option>
            </select>
            <input
              type="text"
              placeholder="Description (e.g., Monthly Salary)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Amount (R)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      )}

      <div className="entries-grid">
        <div className="entries-column">
          <h4>Nikkie's Income</h4>
          {nikkieIncomes.length === 0 ? (
            <p className="no-entries">No income entries</p>
          ) : (
            <ul className="entries-list">
              {nikkieIncomes.map((income) => (
                <li key={income.id} className="entry-item">
                  <div className="entry-info">
                    <span className="entry-category">{income.income_type === 'Salary' ? '💼' : '📦'}</span>
                    <span className="entry-description">
                      {income.description}
                      <span className="income-type-badge">{income.income_type}</span>
                    </span>
                    <span className="entry-amount income">{formatCurrency(Number(income.amount))}</span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(income)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(income.id)}
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
          <h4>Hein's Income</h4>
          {heinIncomes.length === 0 ? (
            <p className="no-entries">No income entries</p>
          ) : (
            <ul className="entries-list">
              {heinIncomes.map((income) => (
                <li key={income.id} className="entry-item">
                  <div className="entry-info">
                    <span className="entry-category">{income.income_type === 'Salary' ? '💼' : '📦'}</span>
                    <span className="entry-description">
                      {income.description}
                      <span className="income-type-badge">{income.income_type}</span>
                    </span>
                    <span className="entry-amount income">{formatCurrency(Number(income.amount))}</span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(income)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(income.id)}
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
