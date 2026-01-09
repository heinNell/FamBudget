-- =============================================
-- STORAGE BUCKET SETUP FOR FINANCIAL STATEMENTS
-- =============================================
-- Run this entire script in Supabase SQL Editor
-- This creates the storage bucket and all necessary policies

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financial-statements',
  'financial-statements',
  false,
  52428800,  -- 50MB file size limit
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow uploads to financial-statements" ON storage.objects;
DROP POLICY IF EXISTS "Allow downloads from financial-statements" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from financial-statements" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates in financial-statements" ON storage.objects;

-- Step 3: Create storage policies for anonymous access

-- Policy for uploads (INSERT)
CREATE POLICY "Allow uploads to financial-statements"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'financial-statements');

-- Policy for downloads (SELECT)
CREATE POLICY "Allow downloads from financial-statements"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'financial-statements');

-- Policy for deletes (DELETE)
CREATE POLICY "Allow deletes from financial-statements"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'financial-statements');

-- Policy for updates (UPDATE)
CREATE POLICY "Allow updates in financial-statements"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'financial-statements');

-- Done! You can now upload files to the financial-statements bucket.
