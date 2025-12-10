import { useState } from 'react';
import './App.css';
import { BalanceTracker } from './components/BalanceTracker';
import { ExpenseSection } from './components/ExpenseSection';
import { IncomeSection } from './components/IncomeSection';
import { MonthSelector } from './components/MonthSelector';
import { SummaryCard } from './components/SummaryCard';
import { TaxSection } from './components/TaxSection';
import { useBalances } from './hooks/useBalances';
import { getCurrentMonth, useBudget } from './hooks/useBudget';

type PageView = 'budget' | 'balances';

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [currentPage, setCurrentPage] = useState<PageView>('budget');
  
  const {
    incomes,
    taxes,
    expenses,
    loading,
    error,
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
    getExpensesByCategory,
  } = useBudget(selectedMonth);

  const {
    accounts,
    loading: balancesLoading,
    error: balancesError,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useBalances();

  const pageError = currentPage === 'budget' ? error : balancesError;

  if (pageError && currentPage === 'budget') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>👨‍👩‍👧 Family Budget Planner</h1>
          <p className="subtitle">Nikkie & Hein's Financial Dashboard</p>
        </header>
        <div className="error-container">
          <h2>⚠️ Connection Error</h2>
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
        <h1>👨‍👩‍👧 Family Budget Planner</h1>
        <p className="subtitle">Nikkie & Hein's Financial Dashboard</p>
        <nav className="app-nav">
          <button 
            className={`nav-btn ${currentPage === 'budget' ? 'active' : ''}`}
            onClick={() => setCurrentPage('budget')}
          >
            Monthly Budget
          </button>
          <button 
            className={`nav-btn ${currentPage === 'balances' ? 'active' : ''}`}
            onClick={() => setCurrentPage('balances')}
          >
            Balance Tracker
          </button>
        </nav>
      </header>

      <main className="app-main">
        {currentPage === 'budget' && (
          <>
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading budget data...</p>
              </div>
            ) : (
              <>
                <SummaryCard summary={summary} />

                <div className="sections-container">
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

                  <ExpenseSection
                    expenses={expenses}
                    balanceAccounts={accounts}
                    onAdd={addExpense}
                    onDelete={deleteExpense}
                    onUpdate={updateExpense}
                    expensesByCategory={getExpensesByCategory()}
                  />
                </div>
              </>
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
                <h2>⚠️ Error Loading Balances</h2>
                <p>{balancesError}</p>
              </div>
            ) : (
              <BalanceTracker
                accounts={accounts}
                onAdd={addAccount}
                onUpdate={updateAccount}
                onDelete={deleteAccount}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Family Budget Planner — Nikkie & Hein</p>
      </footer>
    </div>
  );
}

export default App;
