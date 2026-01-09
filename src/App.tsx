import { useEffect, useState } from 'react';
import './App.css';
import { BalanceTracker } from './components/BalanceTracker';
import { BudgetPage } from './components/BudgetPage';
import { CarryOverExpenses } from './components/CarryOverExpenses';
import { ExpenseSection } from './components/ExpenseSection';
import { FinancialStatements } from './components/FinancialStatements';
import { IncomeSection } from './components/IncomeSection';
import { MonthSelector } from './components/MonthSelector';
import { SummaryCard } from './components/SummaryCard';
import { TaxSection } from './components/TaxSection';
import { UnnecessaryExpenseSection } from './components/UnnecessaryExpenseSection';
import { useBalances } from './hooks/useBalances';
import { getCurrentMonth, useBudget } from './hooks/useBudget';
import { useBudgetTracker } from './hooks/useBudgetTracker';
import type { Expense } from './types/budget';

type PageView = 'budget' | 'balances' | 'tracker';

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [currentPage, setCurrentPage] = useState<PageView>('budget');
  
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

  const {
    loading: trackerLoading,
    error: trackerError,
    addBudget,
    updateBudget,
    deleteBudget,
    addBudgetExpense,
    updateBudgetExpense,
    deleteBudgetExpense,
    getAllBudgetsWithExpenses,
  } = useBudgetTracker(selectedMonth);

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

  const pageError = currentPage === 'budget' ? error : currentPage === 'balances' ? balancesError : trackerError;

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
        <h1>Family Budget Planner</h1>
        <p className="subtitle">Nikkie & Hein's Financial Dashboard</p>
        <nav className="app-nav">
          <button 
            className={`nav-btn ${currentPage === 'budget' ? 'active' : ''}`}
            onClick={() => setCurrentPage('budget')}
          >
            Monthly Budget
          </button>
          <button 
            className={`nav-btn ${currentPage === 'tracker' ? 'active' : ''}`}
            onClick={() => setCurrentPage('tracker')}
          >
            Budget Tracker
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

            {(loading || isCarryingOver) ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>{isCarryingOver ? 'Carrying forward data from previous month...' : 'Loading budget data...'}</p>
              </div>
            ) : (
              <>
                <SummaryCard summary={summary} />

                <CarryOverExpenses
                  currentMonth={selectedMonth}
                  previousMonthExpenses={previousMonthExpenses}
                  onCarryOver={carryOverExpenses}
                  loading={loadingPrevious}
                />

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

                  <UnnecessaryExpenseSection
                    unnecessaryExpenses={unnecessaryExpenses}
                    onAdd={addUnnecessaryExpense}
                    onDelete={deleteUnnecessaryExpense}
                    onUpdate={updateUnnecessaryExpense}
                  />
                </div>

                <FinancialStatements month={selectedMonth} />
              </>
            )}
          </>
        )}

        {currentPage === 'tracker' && (
          <>
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />

            {trackerLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading budget tracker...</p>
              </div>
            ) : trackerError ? (
              <div className="error-container">
                <h2>Error Loading Budget Tracker</h2>
                <p>{trackerError}</p>
              </div>
            ) : (
              <>
                <BudgetPage
                  budgetsWithExpenses={getAllBudgetsWithExpenses()}
                  onAddBudget={addBudget}
                  onUpdateBudget={updateBudget}
                  onDeleteBudget={deleteBudget}
                  onAddExpense={addBudgetExpense}
                  onUpdateExpense={updateBudgetExpense}
                  onDeleteExpense={deleteBudgetExpense}
                />

                <FinancialStatements month={selectedMonth} />
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

      <footer className="app-footer">
        <p>Family Budget Planner — Nikkie & Hein</p>
      </footer>
    </div>
  );
}

export default App;
