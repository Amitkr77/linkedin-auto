'use client';
import { useRef, useState } from 'react';
import Modal from './Modal';

export default function ImportModal({ open, onClose, accounts, onImported }) {
  const [accountId, setAccountId] = useState('');
  const [file, setFile] = useState(null);
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const close = () => {
    setAccountId('');
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
    onClose();
  };

  const importFile = async () => {
    if (!file || !accountId || !timeZone) return;
    setImporting(true);
    setResult(null);
    const form = new FormData();
    form.append('file', file);
    form.append('accountId', accountId);
    form.append('timeZone', timeZone);
    try {
      const response = await fetch('/api/posts/import', {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      if (data.imported > 0) onImported();
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import from CSV / Excel"
      footer={
        <>
          <button className="btn btn-ghost" onClick={close} disabled={importing}>Close</button>
          <button className="btn btn-primary" onClick={importFile} disabled={importing || !file || !accountId || !timeZone}>
            {importing ? 'Importing...' : 'Import posts'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label>LinkedIn account</label>
        <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
          <option value="">Select account</option>
          {accounts.map((account) => (
            <option key={account._id} value={account._id}>
              {account.displayName || account.authorUrn}{account.accountType === 'organization' ? ' (Org)' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>CSV or Excel (.xlsx) file</label>
        <input ref={inputRef} type="file" accept=".csv,.xlsx" onChange={(event) => { setFile(event.target.files[0] || null); setResult(null); }} />
      </div>
      <div className="form-group">
        <label>Schedule time zone</label>
        <input value={timeZone} onChange={(event) => setTimeZone(event.target.value)} placeholder="Asia/Kolkata" />
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Use your sheet headers: Post Text, Image URL (optional), Scheduled Date (YYYY-MM-DD), Scheduled Time (HH:mm), Status (Pending). Posted At and Error are ignored. Already-posted rows and rows with an Automation ID are skipped. Times must be in the future. Up to 100 rows and 2 MB per file.
      </p>
      {result && !result.error && (
        <div className="alert">
          {result.imported} imported; {result.skipped} skipped.
          {result.errors?.length > 0 && (
            <ul>
              {result.errors.slice(0, 10).map((error, index) => <li key={index}>{error}</li>)}
              {result.errors.length > 10 && <li>And {result.errors.length - 10} more errors.</li>}
            </ul>
          )}
        </div>
      )}
      {result?.error && <div className="alert alert-error">{result.error}</div>}
    </Modal>
  );
}
