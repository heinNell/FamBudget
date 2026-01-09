# Expense Carry-Over Feature

## Overview

You can now save expenses from previous months and selectively carry them over to the next month. This is perfect for recurring expenses like rent, subscriptions, utilities, and other regular payments.

## Key Features

### 1. **Recurring Expenses Flag**

- Mark any expense as "recurring" using the 🔄 checkbox
- Recurring expenses are automatically pre-selected when carrying over
- Visual indicator shows which expenses are recurring

### 2. **Carry Over from Previous Month**

- Attractive banner appears when previous month has expenses
- Shows total expense count and number of recurring expenses
- One-click access to carry-over dialog

### 3. **Smart Selection Dialog**

- View all expenses from previous month, organized by category
- Expenses are grouped for easy browsing
- Multiple selection options:
  - **Select All** - Copy all expenses
  - **Select Recurring** - Only copy marked recurring expenses
  - **Manual Selection** - Pick and choose individual expenses

### 4. **Expense Details**

- Each expense shows:
  - Category icon and name
  - Description
  - Member (Nikkie or Hein)
  - Amount
  - Recurring badge (if applicable)
  - Shared status

## Database Changes

Run this SQL in your **Supabase SQL Editor** to add the recurring flag:

```sql
-- Add is_recurring column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
```

## How to Use

### Mark Expenses as Recurring

1. When adding or editing an expense
2. Check the **🔄 Recurring** checkbox
3. These expenses will be pre-selected for carry-over next month

### Carry Over Expenses

1. Navigate to a new month (not the current month where you have expenses)
2. You'll see a purple banner showing expenses from the previous month
3. Click **Carry Over Expenses**
4. In the dialog:
   - Review expenses grouped by category
   - Use **Select Recurring** to auto-select recurring expenses
   - Or manually check/uncheck individual expenses
   - See selection count at top right
5. Click **Carry Over X Expenses** to copy them to the current month
6. Expenses are created with the same details but with the new month

### Example Workflow

**Month 1 (January):**

- Add "Rent" expense → Mark as recurring
- Add "Netflix" expense → Mark as recurring
- Add "Groceries" expense → Don't mark as recurring
- Add "Electricity" expense → Mark as recurring

**Month 2 (February):**

- Purple banner appears: "4 expenses from January • 3 recurring"
- Click "Carry Over Expenses"
- Click "Select Recurring (3)" → Rent, Netflix, and Electricity are selected
- Add or remove individual selections as needed
- Click "Carry Over 3 Expenses"
- All selected expenses are copied to February

## Visual Indicators

- **🔄 Recurring** badge on recurring expenses
- **Shared** badge for shared expenses
- **🔗 Account** badge for linked balance accounts
- Category icons for quick identification
- Purple gradient banner for carry-over prompt

## Benefits

✅ Save time on monthly data entry
✅ Ensure consistency across months
✅ Never forget recurring expenses
✅ Easily adjust amounts for new month
✅ Track which expenses are recurring
✅ Flexible - carry over all, some, or none

## Tips

- Mark all your fixed recurring expenses (rent, subscriptions, insurance) as recurring
- Variable expenses (groceries, entertainment) can be carried over manually
- After carrying over, you can edit amounts if they've changed
- The original expenses from previous months remain unchanged
- You can carry over expenses multiple times if needed
