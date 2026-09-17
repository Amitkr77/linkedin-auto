'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import EmptyState from '@/components/EmptyState';
import styles from './page.module.css';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/accounts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAccounts(data);
    } catch (err) {
      addToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const disconnect = async (id) => {
    if (!confirm('Disconnect this account? Pending/draft posts for this account will be deleted.')) return;
    try {
      const res = await fetch(`/api/auth/accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast('success', 'Account disconnected.');
      fetchAccounts();
    } catch (err) {
      addToast('error', err.message);
    }
  };

  const getTokenStatus = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Expired', cls: styles.expired };
    if (days < 7) return { label: `${days}d left`, cls: styles.expiring };
    return { label: `${days}d left`, cls: styles.healthy };
  };

  return (
    <div>
      <div className="page-header">
        <h1>Accounts</h1>
        <p>Manage your connected LinkedIn accounts.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <a href="/api/auth" className="btn btn-primary">+ Connect Account</a>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : accounts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }
            title="No accounts connected"
            description="Connect your LinkedIn account to start scheduling posts."
            action={<a href="/api/auth" className="btn btn-primary">Connect LinkedIn</a>}
          />
        </div>
      ) : (
        <div className={styles.grid}>
          {accounts.map((acc) => {
            const token = getTokenStatus(acc.tokenExpiresAt);
            return (
              <div key={acc._id} className={`card ${styles.accountCard}`}>
                <div className={styles.header}>
                  <div className={styles.avatar}>
                    {acc.profilePictureUrl ? (
                      <img src={acc.profilePictureUrl} alt="" />
                    ) : (
                      <span>{(acc.displayName || acc.authorUrn)?.[0]?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className={styles.info}>
                    <h3>
                      {acc.displayName || 'LinkedIn User'}
                      <span className={`${styles.typeBadge} ${acc.accountType === 'organization' ? styles.typeOrg : styles.typePerson}`}>
                        {acc.accountType === 'organization' ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            </svg>
                            Org
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            Person
                          </>
                        )}
                      </span>
                    </h3>
                    {acc.email && <p className={styles.email}>{acc.email}</p>}
                    <p className={styles.urn}>{acc.authorUrn}</p>
                  </div>
                </div>

                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Token Status</span>
                    <span className={`${styles.tokenBadge} ${token.cls}`}>{token.label}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Connected</span>
                    <span>{new Date(acc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button className="btn btn-danger btn-sm" onClick={() => disconnect(acc._id)} style={{ marginTop: 16 }}>
                  Disconnect
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
