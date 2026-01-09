import { useEffect, useState } from 'react';
import type { Expense, ExpenseCategory } from '../types/budget';

interface CarryOverExpensesProps {
  currentMonth: string;
  previousMonthExpenses: Expense[];
  onCarryOver: (expenses: Expense[]) => Promise<boolean>;
  loading: boolean;
}

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

/** Format currency for display in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

/** Format month for display */
function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Get previous month in YYYY-MM format */
function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function CarryOverExpenses({
  currentMonth,
  previousMonthExpenses,
  onCarryOver,
  loading,
}: CarryOverExpensesProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const previousMonth = getPreviousMonth(currentMonth);
  const recurringExpenses = previousMonthExpenses.filter((e) => e.is_recurring);

  // Auto-select recurring expenses when dialog opens
  useEffect(() => {
    if (showDialog) {
      const recurringIds = new Set(recurringExpenses.map((e) => e.id));
      // Only update if there's a difference to avoid cascading renders
      if (recurringIds.size > 0) {
        setSelectedExpenses(recurringIds);
      }
    } else {
      // Reset selection when dialog closes
      setSelectedExpenses(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDialog]);

  const toggleExpense = (id: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedExpenses(newSelected);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(new Set(previousMonthExpenses.map((e) => e.id)));
    } else {
      setSelectedExpenses(new Set());
    }
  };

  const selectRecurring = () => {
    setSelectedExpenses(new Set(recurringExpenses.map((e) => e.id)));
  };

  const handleCarryOver = async () => {
    if (selectedExpenses.size === 0) return;

    const expensesToCarry = previousMonthExpenses.filter((e) =>
      selectedExpenses.has(e.id)
    );

    setSubmitting(true);
    const success = await onCarryOver(expensesToCarry);
    
    if (success) {
      setShowDialog(false);
      setSelectedExpenses(new Set());
    }
    
    setSubmitting(false);
  };

  // Group expenses by category
  const expensesByCategory = previousMonthExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  if (previousMonthExpenses.length === 0) {
    return null;
  }

  return (
    <>
      <div className="carry-over-banner">
        <div className="banner-content">
          <span className="banner-icon">LIST</span>
          <div className="banner-text">
            <strong>{previousMonthExpenses.length} expenses</strong> from {formatMonth(previousMonth)}
            {recurringExpenses.length > 0 && (
              <span className="recurring-badge"> • {recurringExpenses.length} recurring</span>
            )}
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowDialog(true)}
          disabled={loading}
        >
          Carry Over Expenses
        </button>
      </div>

      {showDialog && (
        <div className="modal-overlay" onClick={() => setShowDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Carry Over Expenses from {formatMonth(previousMonth)}</h3>
              <button className="close-btn" onClick={() => setShowDialog(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="selection-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => toggleAll(selectedExpenses.size < previousMonthExpenses.length)}
                >
                  {selectedExpenses.size === previousMonthExpenses.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                {recurringExpenses.length > 0 && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={selectRecurring}
                  >
                    Select Recurring ({recurringExpenses.length})
                  </button>
                )}
                <span className="selected-count">
                  {selectedExpenses.size} selected
                </span>
              </div>

              <div className="expenses-list">
                {Object.entries(expensesByCategory).map(([category, expenses]) => (
                  <div key={category} className="category-group">
                    <h4 className="category-header">
                      <span className="category-label" style={{ background: CATEGORY_LABELS[category as ExpenseCategory].color }}>
                        {CATEGORY_LABELS[category as ExpenseCategory].abbr}
                      </span>
                      {category}
                    </h4>
                    {expenses.map((expense) => (
                      <label key={expense.id} className="expense-item">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.has(expense.id)}
                          onChange={() => toggleExpense(expense.id)}
                        />
                        <div className="expense-details">
                          <div className="expense-header">
                            <span className="expense-description">{expense.description}</span>
                            {expense.is_recurring && (
                              <span className="recurring-badge">Recurring</span>
                            )}
                          </div>
                          <div className="expense-meta">
                            <span>{expense.member}</span>
                            {expense.is_shared && <span>• Shared</span>}
                            <span>• {formatCurrency(expense.amount)}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDialog(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCarryOver}
                disabled={submitting || selectedExpenses.size === 0}
              >
                {submitting
                  ? 'Carrying Over...'
                  : `Carry Over ${selectedExpenses.size} Expense${selectedExpenses.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .carry-over-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .banner-icon {
          font-size: 2rem;
        }

        .banner-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .recurring-badge {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #374151;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .selection-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .selected-count {
          margin-left: auto;
          font-weight: 600;
          color: #667eea;
        }

        .expenses-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .category-group {
          background: #f9fafb;
          border-radius: 8px;
          padding: 1rem;
        }

        .category-header {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #374151;
        }

        .expense-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 0.5rem;
        }

        .expense-item:last-child {
          margin-bottom: 0;
        }

        .expense-item:hover {
          background: #f3f4f6;
        }

        .expense-item input[type="checkbox"] {
          cursor: pointer;
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .expense-details {
          flex: 1;
          min-width: 0;
        }

        .expense-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .expense-description {
          font-weight: 500;
          word-break: break-word;
        }

        .recurring-badge {
          background: #10b981;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .expense-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .carry-over-banner {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .modal-content {
            max-height: 95vh;
          }

          .selection-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .selected-count {
            margin-left: 0;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
