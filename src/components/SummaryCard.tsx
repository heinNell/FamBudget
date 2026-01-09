import type { HouseholdSummary } from '../types/budget';

interface SummaryCardProps {
  summary: HouseholdSummary;
}

/** Format currency for display in ZAR */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const { nikkieSummary, heinSummary } = summary;

  return (
    <div className="summary-container">
      {/* Household Summary */}
      <div className="summary-card household">
        <h2>Household Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Gross Income (Salary)</span>
            <span className="value income">{formatCurrency(summary.grossIncome)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Other Income</span>
            <span className="value income">{formatCurrency(summary.otherIncome)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Taxes</span>
            <span className="value taxes">{formatCurrency(summary.totalTaxes)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Net Income (After Tax)</span>
            <span className="value">{formatCurrency(summary.netIncome)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Expenses</span>
            <span className="value expenses">{formatCurrency(summary.totalExpenses)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Unnecessary Expenses</span>
            <span className="value expenses">{formatCurrency(summary.totalUnnecessaryExpenses)}</span>
          </div>
          <div className="summary-item highlight">
            <span className="label">Remaining Balance</span>
            <span className={`value ${summary.remainingBalance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(summary.remainingBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Individual Summaries */}
      <div className="individual-summaries">
        {/* Nikkie's Summary */}
        <div className="summary-card individual nikkie">
          <h3>Nikkie</h3>
          <div className="summary-details">
            <div className="detail-row">
              <span>Gross Income:</span>
              <span className="income">{formatCurrency(nikkieSummary.grossIncome)}</span>
            </div>
            <div className="detail-row">
              <span>Other Income:</span>
              <span className="income">{formatCurrency(nikkieSummary.otherIncome)}</span>
            </div>
            <div className="detail-row">
              <span>Taxes:</span>
              <span className="taxes">{formatCurrency(nikkieSummary.totalTaxes)}</span>
            </div>
            <div className="detail-row">
              <span>Net Income:</span>
              <span>{formatCurrency(nikkieSummary.netIncome)}</span>
            </div>
            <div className="detail-row">
              <span>Expenses:</span>
              <span className="expenses">{formatCurrency(nikkieSummary.totalExpenses)}</span>
            </div>
            <div className="detail-row">
              <span>Unnecessary:</span>
              <span className="expenses">{formatCurrency(nikkieSummary.totalUnnecessaryExpenses)}</span>
            </div>
            <div className="detail-row highlight">
              <span>Balance:</span>
              <span className={nikkieSummary.remainingBalance >= 0 ? 'positive' : 'negative'}>
                {formatCurrency(nikkieSummary.remainingBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Hein's Summary */}
        <div className="summary-card individual hein">
          <h3>Hein</h3>
          <div className="summary-details">
            <div className="detail-row">
              <span>Gross Income:</span>
              <span className="income">{formatCurrency(heinSummary.grossIncome)}</span>
            </div>
            <div className="detail-row">
              <span>Other Income:</span>
              <span className="income">{formatCurrency(heinSummary.otherIncome)}</span>
            </div>
            <div className="detail-row">
              <span>Taxes:</span>
              <span className="taxes">{formatCurrency(heinSummary.totalTaxes)}</span>
            </div>
            <div className="detail-row">
              <span>Net Income:</span>
              <span>{formatCurrency(heinSummary.netIncome)}</span>
            </div>
            <div className="detail-row">
              <span>Expenses:</span>
              <span className="expenses">{formatCurrency(heinSummary.totalExpenses)}</span>
            </div>
            <div className="detail-row">
              <span>Unnecessary:</span>
              <span className="expenses">{formatCurrency(heinSummary.totalUnnecessaryExpenses)}</span>
            </div>
            <div className="detail-row highlight">
              <span>Balance:</span>
              <span className={heinSummary.remainingBalance >= 0 ? 'positive' : 'negative'}>
                {formatCurrency(heinSummary.remainingBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
