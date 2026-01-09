import { useState } from 'react';
import type { FamilyMember, UnnecessaryExpense, UnnecessaryExpenseFormData } from '../types/budget';

interface UnnecessaryExpenseSectionProps {
  unnecessaryExpenses: UnnecessaryExpense[];
  onAdd: (data: UnnecessaryExpenseFormData) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, data: UnnecessaryExpenseFormData) => Promise<boolean>;
}

/** Format currency for display in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function UnnecessaryExpenseSection({
  unnecessaryExpenses,
  onAdd,
  onDelete,
  onUpdate,
}: UnnecessaryExpenseSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [member, setMember] = useState<FamilyMember>('Nikkie');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setNote('');
    setMember('Nikkie');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setSubmitting(true);
    const data: UnnecessaryExpenseFormData = {
      member,
      description: description.trim(),
      amount: parseFloat(amount),
      note: note.trim() || null,
    };

    const success = editingId
      ? await onUpdate(editingId, data)
      : await onAdd(data);

    if (success) {
      resetForm();
    }
    setSubmitting(false);
  };

  const handleEdit = (expense: UnnecessaryExpense) => {
    setEditingId(expense.id);
    setMember(expense.member);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setNote(expense.note || '');
    setIsAdding(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this unnecessary expense?')) {
      await onDelete(id);
    }
  };

  // Inline note update - update when user finishes editing
  const handleNoteUpdate = async (expense: UnnecessaryExpense, newNote: string) => {
    // Only update if note actually changed
    if (expense.note === newNote || (!expense.note && !newNote)) return;
    
    const data: UnnecessaryExpenseFormData = {
      member: expense.member,
      description: expense.description,
      amount: Number(expense.amount),
      note: newNote.trim() || null,
    };
    await onUpdate(expense.id, data);
  };

  const nikkieExpenses = unnecessaryExpenses.filter((e) => e.member === 'Nikkie');
  const heinExpenses = unnecessaryExpenses.filter((e) => e.member === 'Hein');

  const totalNikkie = nikkieExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalHein = heinExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const total = totalNikkie + totalHein;

  return (
    <div className="section unnecessary-expense-section">
      <div className="section-header">
        <h2>Discretionary Expenses</h2>
        <button className="btn-add" onClick={() => { resetForm(); setIsAdding(!isAdding); }}>
          {isAdding ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      <div className="section-summary">
        <span className="summary-label">Total Unnecessary:</span>
        <span className="summary-amount expense">{formatCurrency(total)}</span>
      </div>

      {isAdding && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <span className="form-title">{editingId ? 'Edit Discretionary Expense' : 'New Discretionary Expense'}</span>
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
            <input
              type="text"
              placeholder="Description (e.g., Coffee, Snacks)"
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
          <h4>Nikkie's Unnecessary ({formatCurrency(totalNikkie)})</h4>
          {nikkieExpenses.length === 0 ? (
            <p className="no-entries">No unnecessary expenses</p>
          ) : (
            <ul className="entries-list">
              {nikkieExpenses.map((expense) => (
                <li key={expense.id} className="entry-item">
                  <div className="entry-info">
                    <span className="entry-category disc-expense">DSC</span>
                    <span className="entry-description">{expense.description}</span>
                    <span className="entry-amount expense">{formatCurrency(Number(expense.amount))}</span>
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
          <h4>Hein's Unnecessary ({formatCurrency(totalHein)})</h4>
          {heinExpenses.length === 0 ? (
            <p className="no-entries">No unnecessary expenses</p>
          ) : (
            <ul className="entries-list">
              {heinExpenses.map((expense) => (
                <li key={expense.id} className="entry-item">
                  <div className="entry-info">
                    <span className="entry-category disc-expense">DSC</span>
                    <span className="entry-description">{expense.description}</span>
                    <span className="entry-amount expense">{formatCurrency(Number(expense.amount))}</span>
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
