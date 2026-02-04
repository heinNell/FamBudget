import { calculateCurrentBalance, getCurrentBalanceMonth } from '../hooks/useBalances';
import type { BalanceAccount, Expense, HouseholdSummary } from '../types/budget';

/** Format currency in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface SummaryOverviewProps {
  summary: HouseholdSummary;
  accounts: BalanceAccount[];
  paidExpenses: Expense[];
  selectedMonth: string;
}

export function SummaryOverview({ summary, accounts, paidExpenses, selectedMonth }: SummaryOverviewProps) {
  const currentBalanceMonth = getCurrentBalanceMonth();

  // Calculate actual balance based on paid expenses up to a specific month
  const getActualBalanceForMonth = (account: BalanceAccount, month: string): number => {
    const totalPaid = paidExpenses
      .filter(e => e.balance_account_id === account.id && e.is_paid && e.month <= month)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return Math.max(0, account.initial_balance - totalPaid);
  };

  // Calculate totals for balance accounts
  const totalInitialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initial_balance), 0);
  const totalCurrentBalance = accounts.reduce((sum, acc) => 
    sum + getActualBalanceForMonth(acc, currentBalanceMonth), 0);
  const totalPaidOff = totalInitialBalance - totalCurrentBalance;
  const overallProgress = totalInitialBalance > 0 
    ? ((totalPaidOff / totalInitialBalance) * 100) 
    : 0;

  // Get months remaining estimate (average across all accounts)
  const getMonthsRemaining = (account: BalanceAccount): number => {
    if (account.monthly_deduction <= 0) return Infinity;
    const currentBalance = calculateCurrentBalance(
      account.initial_balance,
      account.monthly_deduction,
      account.start_month,
      currentBalanceMonth
    );
    return Math.ceil(currentBalance / account.monthly_deduction);
  };

  // Format month for display
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="summary-overview">
      <div className="overview-header">
        <h2>Financial Overview</h2>
        <p className="overview-subtitle">Summary for {formatMonth(selectedMonth)}</p>
      </div>

      {/* Monthly Budget Summary */}
      <section className="overview-section">
        <h3>Monthly Budget</h3>
        
        <div className="overview-cards">
          {/* Household Summary */}
          <div className="overview-card household">
            <div className="card-header">
              <span className="card-label">Household</span>
            </div>
            <div className="card-stats">
              <div className="stat-row">
                <span className="stat-label">Total Income</span>
                <span className="stat-value income">{formatCurrency(summary.totalIncome)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Expenses</span>
                <span className="stat-value expense">{formatCurrency(summary.totalExpenses)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Taxes</span>
                <span className="stat-value tax">{formatCurrency(summary.totalTaxes)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Discretionary</span>
                <span className="stat-value discretionary">{formatCurrency(summary.totalUnnecessaryExpenses)}</span>
              </div>
              <div className="stat-row highlight">
                <span className="stat-label">Net Balance</span>
                <span className={`stat-value ${summary.remainingBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(summary.remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Nikkie's Summary */}
          <div className="overview-card nikkie">
            <div className="card-header">
              <span className="card-label">Nikkie</span>
            </div>
            <div className="card-stats">
              <div className="stat-row">
                <span className="stat-label">Income</span>
                <span className="stat-value income">{formatCurrency(summary.nikkieSummary.totalIncome)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Expenses</span>
                <span className="stat-value expense">{formatCurrency(summary.nikkieSummary.totalExpenses)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Taxes</span>
                <span className="stat-value tax">{formatCurrency(summary.nikkieSummary.totalTaxes)}</span>
              </div>
              <div className="stat-row highlight">
                <span className="stat-label">Net</span>
                <span className={`stat-value ${summary.nikkieSummary.remainingBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(summary.nikkieSummary.remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Hein's Summary */}
          <div className="overview-card hein">
            <div className="card-header">
              <span className="card-label">Hein</span>
            </div>
            <div className="card-stats">
              <div className="stat-row">
                <span className="stat-label">Income</span>
                <span className="stat-value income">{formatCurrency(summary.heinSummary.totalIncome)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Expenses</span>
                <span className="stat-value expense">{formatCurrency(summary.heinSummary.totalExpenses)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Taxes</span>
                <span className="stat-value tax">{formatCurrency(summary.heinSummary.totalTaxes)}</span>
              </div>
              <div className="stat-row highlight">
                <span className="stat-label">Net</span>
                <span className={`stat-value ${summary.heinSummary.remainingBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(summary.heinSummary.remainingBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Balance Accounts Summary */}
      {accounts.length > 0 && (
        <section className="overview-section">
          <h3>Balance Accounts</h3>
          
          {/* Overall Progress */}
          <div className="balance-overview-card">
            <div className="balance-overview-header">
              <span className="balance-overview-label">Total Debt Progress</span>
              <span className="balance-overview-percent">{overallProgress.toFixed(1)}% paid off</span>
            </div>
            <div className="balance-overview-progress">
              <div 
                className="balance-overview-fill" 
                style={{ width: `${Math.min(100, overallProgress)}%` }}
              />
            </div>
            <div className="balance-overview-stats">
              <div className="balance-stat">
                <span className="balance-stat-label">Original Total</span>
                <span className="balance-stat-value">{formatCurrency(totalInitialBalance)}</span>
              </div>
              <div className="balance-stat">
                <span className="balance-stat-label">Paid Off</span>
                <span className="balance-stat-value positive">{formatCurrency(totalPaidOff)}</span>
              </div>
              <div className="balance-stat">
                <span className="balance-stat-label">Remaining</span>
                <span className="balance-stat-value">{formatCurrency(totalCurrentBalance)}</span>
              </div>
            </div>
          </div>

          {/* Individual Accounts */}
          <div className="balance-accounts-list">
            {accounts.map((account) => {
              const actualBalance = getActualBalanceForMonth(account, currentBalanceMonth);
              const progress = ((account.initial_balance - actualBalance) / account.initial_balance) * 100;
              const monthsRemaining = getMonthsRemaining(account);

              return (
                <div key={account.id} className="balance-account-row">
                  <div className="balance-account-info">
                    <span className="balance-account-name">{account.name}</span>
                    <span className="balance-account-monthly">
                      {formatCurrency(account.monthly_deduction)}/mo
                    </span>
                  </div>
                  <div className="balance-account-progress">
                    <div className="mini-progress-bar">
                      <div 
                        className="mini-progress-fill" 
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <span className="balance-account-percent">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="balance-account-amounts">
                    <span className={`balance-account-remaining ${actualBalance <= 0 ? 'paid-off' : ''}`}>
                      {formatCurrency(actualBalance)}
                    </span>
                    {actualBalance > 0 && monthsRemaining !== Infinity && (
                      <span className="balance-account-months">
                        ~{monthsRemaining} mo left
                      </span>
                    )}
                    {actualBalance <= 0 && (
                      <span className="balance-account-months paid-off">Paid Off</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="overview-section">
        <h3>Quick Stats</h3>
        <div className="quick-stats-grid">
          <div className="quick-stat">
            <span className="quick-stat-value">{summary.totalIncome > 0 
              ? ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(0) 
              : 0}%</span>
            <span className="quick-stat-label">Expenses to Income</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value">{accounts.length}</span>
            <span className="quick-stat-label">Active Balances</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value">
              {accounts.filter(a => getActualBalanceForMonth(a, currentBalanceMonth) <= 0).length}
            </span>
            <span className="quick-stat-label">Accounts Paid Off</span>
          </div>
          <div className="quick-stat">
            <span className={`quick-stat-value ${summary.remainingBalance >= 0 ? 'positive' : 'negative'}`}>
              {summary.remainingBalance >= 0 ? 'Surplus' : 'Deficit'}
            </span>
            <span className="quick-stat-label">Monthly Status</span>
          </div>
        </div>
      </section>
    </div>
  );
}
