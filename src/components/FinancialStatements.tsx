import { useState } from 'react';
import { useFinancialStatements } from '../hooks/useFinancialStatements';
import type { FamilyMember } from '../types/budget';

interface FinancialStatementsProps {
  month: string;
}

/** Format file size for display */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/** Format date for display */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function FinancialStatements({ month }: FinancialStatementsProps) {
  const { statements, loading, error, uploadStatement, downloadStatement, deleteStatement } = useFinancialStatements(month);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMember, setUploadMember] = useState<FamilyMember>('Nikkie');
  const [uploadNotes, setUploadNotes] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const success = await uploadStatement(selectedFile, uploadMember, uploadNotes);
    
    if (success) {
      setSelectedFile(null);
      setUploadNotes('');
      setShowUploadForm(false);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
    
    setIsUploading(false);
  };

  const handleDownload = async (statement: typeof statements[0]) => {
    await downloadStatement(statement);
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (confirm('Are you sure you want to delete this financial statement?')) {
      await deleteStatement(id, filePath);
    }
  };

  return (
    <div className="financial-statements-section">
      <div className="section-header">
        <h3>Financial Statements</h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          {showUploadForm ? 'Cancel' : '+ Upload Statement'}
        </button>
      </div>

      {showUploadForm && (
        <div className="upload-form card">
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="file-input">Select File *</label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
                required
              />
              {selectedFile && (
                <small className="file-info">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="upload-member">Uploaded By</label>
              <select
                id="upload-member"
                value={uploadMember}
                onChange={(e) => setUploadMember(e.target.value as FamilyMember)}
              >
                <option value="Nikkie">Nikkie</option>
                <option value="Hein">Hein</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="upload-notes">Notes (Optional)</label>
              <input
                id="upload-notes"
                type="text"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="e.g., Bank statement, Credit card statement"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isUploading || !selectedFile}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setUploadNotes('');
                }}
                disabled={isUploading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-message">Loading statements...</div>
      ) : statements.length === 0 ? (
        <div className="empty-state">
          <p>No financial statements uploaded for this month.</p>
          <p>Upload bank statements, invoices, or other financial documents to keep track of your records.</p>
        </div>
      ) : (
        <div className="statements-list">
          {statements.map((statement) => (
            <div key={statement.id} className="statement-item card">
              <div className="statement-icon entry-category" style={{ background: statement.content_type.includes('pdf') ? '#ef4444' : statement.content_type.includes('spreadsheet') || statement.content_type.includes('excel') ? '#10b981' : statement.content_type.includes('image') ? '#8b5cf6' : '#64748b' }}>
                {statement.content_type.includes('pdf') ? 'PDF' :
                 statement.content_type.includes('spreadsheet') || statement.content_type.includes('excel') ? 'XLS' :
                 statement.content_type.includes('image') ? 'IMG' :
                 'DOC'}
              </div>
              <div className="statement-details">
                <h4>{statement.filename}</h4>
                <div className="statement-meta">
                  <span>Size: {formatFileSize(statement.file_size)}</span>
                  {statement.uploaded_by && <span>• Uploaded by: {statement.uploaded_by}</span>}
                  <span>• {formatDate(statement.created_at)}</span>
                </div>
                {statement.notes && (
                  <p className="statement-notes">{statement.notes}</p>
                )}
              </div>
              <div className="statement-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleDownload(statement)}
                  title="Download"
                >
                  <span className="btn-icon-text">Download</span>
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(statement.id, statement.file_path)}
                  title="Delete"
                >
                  <span className="btn-icon-text">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .financial-statements-section {
          margin: 2rem 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .upload-form {
          margin-bottom: 1.5rem;
          padding: 1.5rem;
        }

        .file-info {
          display: block;
          margin-top: 0.5rem;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          background: #f8f9fa;
          border-radius: 8px;
          color: #666;
        }

        .empty-state p {
          margin: 0.5rem 0;
        }

        .statements-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .statement-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
        }

        .statement-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .statement-details {
          flex: 1;
          min-width: 0;
        }

        .statement-details h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          word-break: break-word;
        }

        .statement-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #666;
        }

        .statement-notes {
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
          color: #555;
          font-style: italic;
        }

        .statement-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background-color: #c82333;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .loading-message {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        @media (max-width: 768px) {
          .statement-item {
            flex-direction: column;
          }

          .statement-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .section-header h3 {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
