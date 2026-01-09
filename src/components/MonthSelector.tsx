import { getCurrentMonth } from '../hooks/useBudget';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

/** Generate list of months from October 2025 through December 2026 */
function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  
  // Start from October 2025 and go through December 2026
  const startDate = new Date(2025, 9, 1); // October 2025
  const endDate = new Date(2026, 11, 1); // December 2026
  
  const current = new Date(startDate);
  while (current <= endDate) {
    const value = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const label = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
    current.setMonth(current.getMonth() + 1);
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
