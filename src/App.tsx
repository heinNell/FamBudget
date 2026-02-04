import { useEffect, useState } from 'react';
import './App.css';
import { BalanceTracker } from './components/BalanceTracker';
import { CarryOverExpenses } from './components/CarryOverExpenses';
import { ExpenseSection } from './components/ExpenseSection';
import { FinancialStatements } from './components/FinancialStatements';
import { IncomeSection } from './components/IncomeSection';
import { MonthSelector } from './components/MonthSelector';
import { QuickAddModal } from './components/QuickAddModal';
import { SummaryCard } from './components/SummaryCard';
import { SummaryOverview } from './components/SummaryOverview';
import { TaxSection } from './components/TaxSection';
import { UnnecessaryExpenseSection } from './components/UnnecessaryExpenseSection';
import { useBalances } from './hooks/useBalances';
import { getCurrentMonth, useBudget } from './hooks/useBudget';
import type { Expense } from './types/budget';

type PageView = 'budget' | 'balances' | 'summary';
type BudgetTab = 'income' | 'expenses' | 'documents';

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [currentPage, setCurrentPage] = useState<PageView>('budget');
  const [budgetTab, setBudgetTab] = useState<BudgetTab>('expenses');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  
  const {
    incomes,
    taxes,
    expenses,
    unnecessaryExpenses,
    loading,
    error,
    isCarryingOver,
    summary,
    addIncome,
    deleteIncome,
    updateIncome,
    addTax,
    deleteTax,
    updateTax,
    addExpense,
    deleteExpense,
    updateExpense,
    addUnnecessaryExpense,
    deleteUnnecessaryExpense,
    updateUnnecessaryExpense,
    getExpensesByCategory,
    fetchPreviousMonthExpenses,
    carryOverExpenses,
  } = useBudget(selectedMonth);

  const {
    accounts,
    paidExpenses,
    loading: balancesLoading,
    error: balancesError,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useBalances();

  // State for previous month expenses
  const [previousMonthExpenses, setPreviousMonthExpenses] = useState<Expense[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  // Fetch previous month expenses when month changes
  useEffect(() => {
    const loadPreviousExpenses = async () => {
      setLoadingPrevious(true);
      const prevExpenses = await fetchPreviousMonthExpenses();
      setPreviousMonthExpenses(prevExpenses);
      setLoadingPrevious(false);
    };
    loadPreviousExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const pageError = currentPage === 'budget' ? error : currentPage === 'balances' ? balancesError : null;

  if (pageError && currentPage === 'budget') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Family Budget Planner</h1>
          <p className="subtitle">Nikkie & Hein's Financial Dashboard</p>
        </header>
        <div className="error-container">
          <h2>Connection Error</h2>
          <p>{pageError}</p>
          <p>
            Please ensure your Supabase credentials are configured in <code>.env</code> file:
          </p>
          <pre>
            VITE_SUPABASE_URL=your_supabase_url{'\n'}
            VITE_SUPABASE_ANON_KEY=your_anon_key
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <h1>Family Budget Planner</h1>
            <p className="subtitle">Nikkie & Hein's Financial Dashboard</p>
          </div>
          <nav className="app-nav">
            <button 
              className={`nav-btn ${currentPage === 'budget' ? 'active' : ''}`}
              onClick={() => setCurrentPage('budget')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              <span>Budget</span>
            </button>
            <button 
              className={`nav-btn ${currentPage === 'summary' ? 'active' : ''}`}
              onClick={() => setCurrentPage('summary')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
              <span>Summary</span>
            </button>
            <button 
              className={`nav-btn ${currentPage === 'balances' ? 'active' : ''}`}
              onClick={() => setCurrentPage('balances')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span>Balances</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'budget' && (
          <div className="budget-layout">
            {/* Sticky Sidebar with Summary */}
            <aside className="budget-sidebar">
              <div className="sidebar-month">
                <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
              </div>
              
              {!loading && !isCarryingOver && (
                <div className="sidebar-summary">
                  <SummaryCard summary={summary} compact />
                </div>
              )}
            </aside>

            {/* Main Content Area */}
            <div className="budget-content">
              {(loading || isCarryingOver) ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>{isCarryingOver ? 'Carrying forward data from previous month...' : 'Loading budget data...'}</p>
                </div>
              ) : (
                <>
                  {/* Tab Navigation */}
                  <div className="budget-tabs">
                    <button
                      className={`tab-btn ${budgetTab === 'income' ? 'active' : ''}`}
                      onClick={() => setBudgetTab('income')}
                    >
                      <span className="tab-icon income">💰</span>
                      Income & Tax
                    </button>
                    <button
                      className={`tab-btn ${budgetTab === 'expenses' ? 'active' : ''}`}
                      onClick={() => setBudgetTab('expenses')}
                    >
                      <span className="tab-icon expense">📊</span>
                      Expenses
                    </button>
                    <button
                      className={`tab-btn ${budgetTab === 'documents' ? 'active' : ''}`}
                      onClick={() => setBudgetTab('documents')}
                    >
                      <span className="tab-icon docs">📄</span>
                      Documents
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="tab-content">
                    {budgetTab === 'income' && (
                      <div className="tab-panel income-tax-panel">
                        <div className="panel-grid">
                          <IncomeSection
                            incomes={incomes}
                            onAdd={addIncome}
                            onDelete={deleteIncome}
                            onUpdate={updateIncome}
                          />
                          <TaxSection
                            taxes={taxes}
                            onAdd={addTax}
                            onDelete={deleteTax}
                            onUpdate={updateTax}
                          />
                        </div>
                      </div>
                    )}

                    {budgetTab === 'expenses' && (
                      <div className="tab-panel expenses-panel">
                        <CarryOverExpenses
                          currentMonth={selectedMonth}
                          previousMonthExpenses={previousMonthExpenses}
                          onCarryOver={carryOverExpenses}
                          loading={loadingPrevious}
                        />
                        
                        <div className="expenses-grid">
                          <ExpenseSection
                            expenses={expenses}
                            balanceAccounts={accounts}
                            onAdd={addExpense}
                            onDelete={deleteExpense}
                            onUpdate={updateExpense}
                            expensesByCategory={getExpensesByCategory()}
                          />
                        </div>

                        <UnnecessaryExpenseSection
                          unnecessaryExpenses={unnecessaryExpenses}
                          onAdd={addUnnecessaryExpense}
                          onDelete={deleteUnnecessaryExpense}
                          onUpdate={updateUnnecessaryExpense}
                        />
                      </div>
                    )}

                    {budgetTab === 'documents' && (
                      <div className="tab-panel documents-panel">
                        <FinancialStatements month={selectedMonth} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {currentPage === 'summary' && (
          <>
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />

            {(loading || balancesLoading) ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading summary data...</p>
              </div>
            ) : (
              <SummaryOverview
                summary={summary}
                accounts={accounts}
                paidExpenses={paidExpenses}
                selectedMonth={selectedMonth}
              />
            )}
          </>
        )}

        {currentPage === 'balances' && (
          <>
            {balancesLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading balance data...</p>
              </div>
            ) : balancesError ? (
              <div className="error-container">
                <h2>Error Loading Balances</h2>
                <p>{balancesError}</p>
              </div>
            ) : (
              <BalanceTracker
                accounts={accounts}
                paidExpenses={paidExpenses}
                onAdd={addAccount}
                onUpdate={updateAccount}
                onDelete={deleteAccount}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button for Quick Add */}
      {currentPage === 'budget' && !loading && !isCarryingOver && (
        <button
          className="fab-quick-add"
          onClick={() => setQuickAddOpen(true)}
          title="Quick Add Entry"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="fab-label">Quick Add</span>
        </button>
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        balanceAccounts={accounts}
        onAddIncome={addIncome}
        onAddTax={addTax}
        onAddExpense={addExpense}
        onAddUnnecessaryExpense={addUnnecessaryExpense}
      />

      <footer className="app-footer">
        <p>Family Budget Planner — Nikkie & Hein</p>
      </footer>
    </div>
  );
}

export default App;
