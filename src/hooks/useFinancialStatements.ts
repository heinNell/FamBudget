import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { FamilyMember, FinancialStatement } from '../types/budget';

const STORAGE_BUCKET = 'financial-statements';

/**
 * Hook for managing financial statements CRUD operations
 */
export function useFinancialStatements(month: string) {
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('financial_statements')
        .select('*')
        .eq('month', month)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setStatements(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch financial statements';
      setError(message);
      console.error('Error fetching financial statements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statements for the current month
  useEffect(() => {
    fetchStatements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const uploadStatement = async (
    file: File,
    uploadedBy: FamilyMember,
    notes?: string
  ): Promise<boolean> => {
    try {
      setError(null);

      // Create unique file path
      const fileName = `${month}/${Date.now()}-${file.name}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, try to create it
        if (uploadError.message.includes('Bucket not found')) {
          const { error: createBucketError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
            public: false,
            fileSizeLimit: 52428800 // 50MB
          });

          if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
          }

          // Retry upload
          const { error: retryError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      // Insert metadata into database
      const { error: insertError } = await supabase
        .from('financial_statements')
        .insert({
          month,
          filename: file.name,
          file_path: fileName,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: uploadedBy,
          notes: notes || ''
        });

      if (insertError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
        throw insertError;
      }

      await fetchStatements();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      console.error('Error uploading financial statement:', err);
      return false;
    }
  };

  const downloadStatement = async (statement: FinancialStatement): Promise<void> => {
    try {
      setError(null);

      const { data, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(statement.file_path);

      if (downloadError) throw downloadError;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = statement.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download file';
      setError(message);
      console.error('Error downloading financial statement:', err);
    }
  };

  const deleteStatement = async (id: string, filePath: string): Promise<boolean> => {
    try {
      setError(null);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('financial_statements')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchStatements();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete statement';
      setError(message);
      console.error('Error deleting financial statement:', err);
      return false;
    }
  };

  return {
    statements,
    loading,
    error,
    uploadStatement,
    downloadStatement,
    deleteStatement,
    refresh: fetchStatements
  };
}
