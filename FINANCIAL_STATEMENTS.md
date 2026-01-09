# Financial Statements Upload Feature

## Overview

This feature allows you to upload and manage financial statements (bank statements, credit card statements, invoices, etc.) for each month alongside your budget data.

## Database Setup

### 1. Create the Database Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Financial Statements table (for uploading monthly financial documents)
CREATE TABLE IF NOT EXISTS financial_statements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month TEXT NOT NULL, -- Format: YYYY-MM
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size INTEGER NOT NULL, -- Size in bytes
  content_type TEXT NOT NULL, -- MIME type
  uploaded_by TEXT CHECK (uploaded_by IN ('Nikkie', 'Hein')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for financial statements
CREATE INDEX IF NOT EXISTS idx_financial_statements_month ON financial_statements(month);
CREATE INDEX IF NOT EXISTS idx_financial_statements_uploaded_by ON financial_statements(uploaded_by);

-- Policies for financial statements
CREATE POLICY "Allow all access to financial_statements" ON financial_statements FOR ALL USING (true);
```

### 2. Create Storage Bucket

The storage bucket will be automatically created when you upload your first file. However, you can manually create it:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New Bucket**
4. Name: `financial-statements`
5. Set as **Private** (recommended for financial documents)
6. Set file size limit: **50 MB**
7. Click **Create**

### 3. Configure Storage Policies (Optional - for production)

For development, files are accessible to all users. For production, you may want to add RLS policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'financial-statements');

-- Allow authenticated users to download their files
CREATE POLICY "Allow downloads" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'financial-statements');

-- Allow authenticated users to delete their files
CREATE POLICY "Allow deletes" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'financial-statements');
```

## Features

### Upload Financial Statements

- Upload various file types: PDF, Excel, CSV, Word documents, images
- Maximum file size: 50 MB
- Track who uploaded each file (Nikkie or Hein)
- Add optional notes to each upload

### View Statements

- See all statements for the selected month
- Visual file type indicators (📕 for PDF, 📊 for spreadsheets, etc.)
- File size and upload date display
- Optional notes for context

### Download Statements

- One-click download of any uploaded statement
- Original filename preserved

### Delete Statements

- Remove unwanted statements
- Confirmation dialog to prevent accidental deletions
- Automatically removes both database record and file from storage

## Usage

1. Navigate to **Monthly Budget** or **Budget Tracker** page
2. Select the month you want to manage
3. Scroll to the **📄 Financial Statements** section
4. Click **+ Upload Statement**
5. Select your file
6. Choose who's uploading (Nikkie or Hein)
7. Add optional notes (e.g., "Bank statement", "Credit card bill")
8. Click **Upload**

## Supported File Types

- **Documents**: PDF, DOC, DOCX
- **Spreadsheets**: XLS, XLSX, CSV
- **Images**: PNG, JPG, JPEG

## Technical Details

### Components

- `FinancialStatements.tsx` - Main UI component
- `useFinancialStatements.ts` - React hook for data management

### Database Schema

- Table: `financial_statements`
- Storage bucket: `financial-statements`

### File Storage

Files are stored in Supabase Storage with the following path structure:

```
financial-statements/
  └── YYYY-MM/
      └── timestamp-filename.ext
```

## Troubleshooting

### Upload Fails

- Ensure your Supabase project has storage enabled
- Check file size (must be < 50 MB)
- Verify your `.env` file has correct credentials

### Can't Download Files

- Check Supabase Storage bucket policies
- Ensure the file still exists in storage

### Bucket Creation Failed

- Manually create the bucket in Supabase dashboard
- Make sure your user has storage permissions
