import { getCurrentMonth } from '../hooks/useBudget';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

/** Generate list of months (current month and 11 previous months) */
function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }

  return options;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const months = getMonthOptions();
  const isCurrentMonth = selectedMonth === getCurrentMonth();

  return (
    <div className="month-selector">
      <label htmlFor="month-select">Select Month:</label>
      <select
        id="month-select"
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
      >
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      {isCurrentMonth && <span className="current-badge">Current</span>}
    </div>
  );
}
