import { useState } from 'react';
import type {
    BudgetEntryFormData,
    BudgetExpenseFormData,
    BudgetWithExpenses,
    ExpenseCategory,
    FamilyMember,
} from '../types/budget';

interface BudgetPageProps {
  budgetsWithExpenses: BudgetWithExpenses[];
  onAddBudget: (data: BudgetEntryFormData) => Promise<boolean>;
  onUpdateBudget: (id: string, data: BudgetEntryFormData) => Promise<boolean>;
  onDeleteBudget: (id: string) => Promise<boolean>;
  onAddExpense: (budgetId: string, data: BudgetExpenseFormData) => Promise<boolean>;
  onUpdateExpense: (id: string, data: BudgetExpenseFormData) => Promise<boolean>;
  onDeleteExpense: (id: string) => Promise<boolean>;
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
  Utilities: { abbr: 'UTL', color: '#f59e0b' },
  Groceries: { abbr: 'GRC', color: '#10b981' },
  Transportation: { abbr: 'TRN', color: '#3b82f6' },
  Healthcare: { abbr: 'MED', color: '#ef4444' },
  Entertainment: { abbr: 'ENT', color: '#8b5cf6' },
  Dining: { abbr: 'DIN', color: '#f97316' },
  Shopping: { abbr: 'SHP', color: '#ec4899' },
  Education: { abbr: 'EDU', color: '#06b6d4' },
  Insurance: { abbr: 'INS', color: '#64748b' },
  Savings: { abbr: 'SAV', color: '#22c55e' },
  Other: { abbr: 'OTH', color: '#94a3b8' },
};

/** Format currency for display in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

/** Format date to YYYY-MM-DD */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function BudgetPage({
  budgetsWithExpenses,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: BudgetPageProps) {
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [addingExpenseTo, setAddingExpenseTo] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Budget form state
  const [budgetName, setBudgetName] = useState('');
  const [budgetDescription, setBudgetDescription] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetMember, setBudgetMember] = useState<FamilyMember>('Nikkie');
  const [budgetCategory, setBudgetCategory] = useState<ExpenseCategory>('Groceries');

  // Expense form state
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(formatDate(new Date()));

  const [submitting, setSubmitting] = useState(false);

  const resetBudgetForm = () => {
    setBudgetName('');
    setBudgetDescription('');
    setBudgetAmount('');
    setBudgetMember('Nikkie');
    setBudgetCategory('Groceries');
    setIsAddingBudget(false);
    setEditingBudgetId(null);
  };

  const resetExpenseForm = () => {
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseDate(formatDate(new Date()));
    setAddingExpenseTo(null);
    setEditingExpenseId(null);
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetName.trim() || !budgetAmount) return;

    setSubmitting(true);
    const data: BudgetEntryFormData = {
      name: budgetName.trim(),
      description: budgetDescription.trim(),
      budget_amount: parseFloat(budgetAmount),
      member: budgetMember,
      category: budgetCategory,
    };

    const success = editingBudgetId
      ? await onUpdateBudget(editingBudgetId, data)
      : await onAddBudget(data);

    if (success) {
      resetBudgetForm();
    }
    setSubmitting(false);
  };

  const handleExpenseSubmit = async (e: React.FormEvent, budgetId: string) => {
    e.preventDefault();
    if (!expenseDescription.trim() || !expenseAmount) return;

    setSubmitting(true);
    const data: BudgetExpenseFormData = {
      description: expenseDescription.trim(),
      amount: parseFloat(expenseAmount),
      date: expenseDate,
    };

    const success = editingExpenseId
      ? await onUpdateExpense(editingExpenseId, data)
      : await onAddExpense(budgetId, data);

    if (success) {
      resetExpenseForm();
    }
    setSubmitting(false);
  };

  const startEditBudget = (budgetWithExpenses: BudgetWithExpenses) => {
    const { budget } = budgetWithExpenses;
    setBudgetName(budget.name);
    setBudgetDescription(budget.description);
    setBudgetAmount(budget.budget_amount.toString());
    setBudgetMember(budget.member);
    setBudgetCategory(budget.category);
    setEditingBudgetId(budget.id);
    setIsAddingBudget(true);
  };

  const startEditExpense = (budgetId: string, expense: any) => {
    setExpenseDescription(expense.description);
    setExpenseAmount(expense.amount.toString());
    setExpenseDate(expense.date);
    setEditingExpenseId(expense.id);
    setAddingExpenseTo(budgetId);
  };

  const toggleBudgetExpanded = (budgetId: string) => {
    setExpandedBudgetId(expandedBudgetId === budgetId ? null : budgetId);
  };

  return (
    <div className="budget-page">
      <div className="page-header">
        <h2>Budget Tracker</h2>
        <p className="subtitle">Set budgets and track your spending</p>
        {!isAddingBudget && (
          <button className="btn btn-primary" onClick={() => setIsAddingBudget(true)}>
            + New Budget
          </button>
        )}
      </div>

      {/* Add/Edit Budget Form */}
      {isAddingBudget && (
        <div className="form-card">
          <h3 className="form-title">{editingBudgetId ? 'Edit Budget' : 'New Budget'}</h3>
          <form onSubmit={handleBudgetSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Budget Name *</label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g., Weekly Groceries"
                  required
                />
              </div>
              <div className="form-group">
                <label>Budget Amount *</label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Member</label>
                <select value={budgetMember} onChange={(e) => setBudgetMember(e.target.value as FamilyMember)}>
                  <option value="Nikkie">Nikkie</option>
                  <option value="Hein">Hein</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value as ExpenseCategory)}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={budgetDescription}
                onChange={(e) => setBudgetDescription(e.target.value)}
                placeholder="Optional notes about this budget"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingBudgetId ? 'Update Budget' : 'Create Budget'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetBudgetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget List */}
      <div className="budgets-container">
        {budgetsWithExpenses.length === 0 ? (
          <div className="empty-state">
            <p>No budgets yet. Create one to start tracking your spending!</p>
          </div>
        ) : (
          budgetsWithExpenses.map((budgetWithExpenses) => {
            const { budget, expenses, totalSpent, remainingBalance, percentageUsed } = budgetWithExpenses;
            const isExpanded = expandedBudgetId === budget.id;
            const isOverBudget = remainingBalance < 0;

            return (
              <div key={budget.id} className={`budget-card ${isOverBudget ? 'over-budget' : ''}`}>
                <div className="budget-header" onClick={() => toggleBudgetExpanded(budget.id)}>
                  <div className="budget-info">
                    <h3>
                      <span className="entry-category" style={{ background: CATEGORY_LABELS[budget.category].color }}>{CATEGORY_LABELS[budget.category].abbr}</span> {budget.name}
                    </h3>
                    <p className="budget-meta">
                      {budget.member} • {budget.category}
                      {budget.description && ` • ${budget.description}`}
                    </p>
                  </div>
                  <div className="budget-amounts">
                    <div className="budget-stat">
                      <span className="label">Budget</span>
                      <span className="value">{formatCurrency(budget.budget_amount)}</span>
                    </div>
                    <div className="budget-stat">
                      <span className="label">Spent</span>
                      <span className="value spent">{formatCurrency(totalSpent)}</span>
                    </div>
                    <div className="budget-stat">
                      <span className="label">Remaining</span>
                      <span className={`value ${isOverBudget ? 'negative' : 'positive'}`}>
                        {formatCurrency(remainingBalance)}
                      </span>
                    </div>
                  </div>
                  <button className="expand-btn">{isExpanded ? '▼' : '▶'}</button>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${percentageUsed > 100 ? 'over' : percentageUsed > 80 ? 'warning' : ''}`}
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  />
                  <span className="progress-text">{percentageUsed.toFixed(1)}% used</span>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="budget-details">
                    <div className="budget-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setAddingExpenseTo(budget.id)}
                      >
                        + Add Expense
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => startEditBudget(budgetWithExpenses)}
                      >
                        <span className="btn-icon-text">Edit Budget</span>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={async () => {
                          if (confirm('Delete this budget and all its expenses?')) {
                            await onDeleteBudget(budget.id);
                          }
                        }}
                      >
                        <span className="btn-icon-text">Delete</span>
                      </button>
                    </div>

                    {/* Add Expense Form */}
                    {addingExpenseTo === budget.id && (
                      <div className="expense-form">
                        <h4 className="form-title">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h4>
                        <form onSubmit={(e) => handleExpenseSubmit(e, budget.id)}>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Description *</label>
                              <input
                                type="text"
                                value={expenseDescription}
                                onChange={(e) => setExpenseDescription(e.target.value)}
                                placeholder="What did you spend on?"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Amount *</label>
                              <input
                                type="number"
                                value={expenseAmount}
                                onChange={(e) => setExpenseAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Date *</label>
                              <input
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="form-actions">
                            <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                              {submitting ? 'Saving...' : editingExpenseId ? 'Update' : 'Add'}
                            </button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={resetExpenseForm}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Expenses List */}
                    <div className="expenses-list">
                      <h4>Expenses ({expenses.length})</h4>
                      {expenses.length === 0 ? (
                        <p className="empty-message">No expenses recorded yet.</p>
                      ) : (
                        <table className="expenses-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Description</th>
                              <th>Amount</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.map((expense) => (
                              <tr key={expense.id}>
                                <td>{new Date(expense.date).toLocaleDateString()}</td>
                                <td>{expense.description}</td>
                                <td className="amount">{formatCurrency(expense.amount)}</td>
                                <td className="actions">
                                  <button
                                    className="btn-edit"
                                    onClick={() => startEditExpense(budget.id, expense)}
                                    title="Edit"
                                  >
                                    <span className="btn-icon-text">Edit</span>
                                  </button>
                                  <button
                                    className="btn-delete"
                                    onClick={async () => {
                                      if (confirm('Delete this expense?')) {
                                        await onDeleteExpense(expense.id);
                                      }
                                    }}
                                    title="Delete"
                                  >
                                    <span className="btn-icon-text">Delete</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
