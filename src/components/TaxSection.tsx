import { useState } from 'react';
import type { FamilyMember, Tax, TaxFormData } from '../types/budget';

interface TaxSectionProps {
  taxes: Tax[];
  onAdd: (data: TaxFormData) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, data: TaxFormData) => Promise<boolean>;
}

/** Format currency for display in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function TaxSection({ taxes, onAdd, onDelete, onUpdate }: TaxSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [member, setMember] = useState<FamilyMember>('Nikkie');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setMember('Nikkie');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setSubmitting(true);
    const data: TaxFormData = {
      member,
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

  const handleEdit = (tax: Tax) => {
    setEditingId(tax.id);
    setMember(tax.member);
    setDescription(tax.description);
    setAmount(String(tax.amount));
    setIsAdding(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tax entry?')) {
      await onDelete(id);
    }
  };

  const nikkieTaxes = taxes.filter((t) => t.member === 'Nikkie');
  const heinTaxes = taxes.filter((t) => t.member === 'Hein');

  return (
    <div className="section tax-section">
      <div className="section-header">
        <h2>🏛️ Taxes</h2>
        <button className="btn-add" onClick={() => { resetForm(); setIsAdding(!isAdding); }}>
          {isAdding ? 'Cancel' : '+ Add Tax'}
        </button>
      </div>

      {isAdding && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <span>{editingId ? '✏️ Edit Tax' : '➕ New Tax'}</span>
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
              placeholder="Description (e.g., PAYE, UIF)"
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
          <h4>Nikkie's Taxes</h4>
          {nikkieTaxes.length === 0 ? (
            <p className="no-entries">No tax entries</p>
          ) : (
            <ul className="entries-list">
              {nikkieTaxes.map((tax) => (
                <li key={tax.id} className="entry-item">
                  <div className="entry-info">
                    <span className="entry-description">{tax.description}</span>
                    <span className="entry-amount taxes">{formatCurrency(Number(tax.amount))}</span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(tax)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(tax.id)}
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
          <h4>Hein's Taxes</h4>
          {heinTaxes.length === 0 ? (
            <p className="no-entries">No tax entries</p>
          ) : (
            <ul className="entries-list">
              {heinTaxes.map((tax) => (
                <li key={tax.id} className="entry-item">
                  <div className="entry-info">
                    <span className="entry-description">{tax.description}</span>
                    <span className="entry-amount taxes">{formatCurrency(Number(tax.amount))}</span>
                  </div>
                  <div className="entry-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(tax)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(tax.id)}
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
