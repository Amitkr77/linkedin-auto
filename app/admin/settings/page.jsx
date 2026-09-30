'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(async (r) => {
        if (r.status === 401) { router.replace('/admin'); return; }
        const json = await r.json();
        if (json.success) setSettings(json.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
        setMsg('Settings saved.');
      } else {
        setMsg(json.error || 'Failed to save.');
      }
    } catch { setMsg('Network error.'); }
    setSaving(false);
  };

  const testEmail = async () => {
    setTesting(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/settings', { method: 'POST' });
      const json = await res.json();
      setMsg(json.success ? json.message : json.error);
    } catch { setMsg('Failed to send test email.'); }
    setTesting(false);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>Loading...</div>;
  if (!settings) return <div style={{ padding: 40 }}>Failed to load settings. <a href="/admin">Back</a></div>;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div>
              <h1 className={styles.headerTitle}>Platform Settings</h1>
              <p className={styles.headerSub}>Configure email, limits, and platform behavior.</p>
            </div>
          </div>
          <a href="/admin/dashboard" className={styles.backLink}>&larr; Back to dashboard</a>
        </div>

        {/* ─── Email / SMTP ─── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Email notifications</h2>
          <p className={styles.sectionDesc}>Gmail SMTP settings for sending publish/fail notifications to users.</p>
          <div className={`card ${styles.sectionCard}`}>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Gmail address</span>
              <input className={styles.formInput} value={settings.smtpEmail || ''} onChange={(e) => update('smtpEmail', e.target.value)} placeholder="your-email@gmail.com" />
            </div>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>App password</span>
              <div>
                <input className={styles.formInput} value={settings.smtpPassword || settings.smtpPasswordMasked || ''} onChange={(e) => update('smtpPassword', e.target.value)} placeholder="xxxx xxxx xxxx xxxx" type="password" />
                <p className={styles.formHint}>Use a Gmail App Password, not your regular password. <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Generate one here</a></p>
              </div>
            </div>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Enabled</span>
              <div className={styles.formToggle}>
                <button type="button" className={`${styles.toggle} ${settings.emailNotificationsEnabled ? styles.on : ''}`} onClick={() => update('emailNotificationsEnabled', !settings.emailNotificationsEnabled)} />
                <span className={styles.toggleLabel}>{settings.emailNotificationsEnabled ? 'On — users receive emails' : 'Off — no emails sent'}</span>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={testEmail} disabled={testing} style={{ marginTop: 12 }}>
              {testing ? 'Sending...' : 'Send test email'}
            </button>
          </div>
        </div>

        {/* ─── Platform ─── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Platform</h2>
          <p className={styles.sectionDesc}>General platform settings.</p>
          <div className={`card ${styles.sectionCard}`}>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Platform name</span>
              <input className={styles.formInput} value={settings.platformName || ''} onChange={(e) => update('platformName', e.target.value)} />
            </div>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Platform URL</span>
              <input className={styles.formInput} value={settings.platformUrl || ''} onChange={(e) => update('platformUrl', e.target.value)} placeholder="https://linkedin-auto-vwge.vercel.app" />
            </div>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Maintenance mode</span>
              <div className={styles.formToggle}>
                <button type="button" className={`${styles.toggle} ${settings.maintenanceMode ? styles.on : ''}`} onClick={() => update('maintenanceMode', !settings.maintenanceMode)} />
                <span className={styles.toggleLabel}>{settings.maintenanceMode ? 'ON — users see maintenance page' : 'Off'}</span>
              </div>
            </div>
            {settings.maintenanceMode && (
              <div className={styles.formRow}>
                <span className={styles.formLabel}>Message</span>
                <input className={styles.formInput} value={settings.maintenanceMessage || ''} onChange={(e) => update('maintenanceMessage', e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* ─── User limits ─── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>User limits</h2>
          <p className={styles.sectionDesc}>Control resource usage per user.</p>
          <div className={`card ${styles.sectionCard}`}>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Max posts/user</span>
              <input className={styles.formInput} type="number" value={settings.maxPostsPerUser || 500} onChange={(e) => update('maxPostsPerUser', parseInt(e.target.value) || 500)} style={{ width: 120 }} />
            </div>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Max templates/user</span>
              <input className={styles.formInput} type="number" value={settings.maxTemplatesPerUser || 50} onChange={(e) => update('maxTemplatesPerUser', parseInt(e.target.value) || 50)} style={{ width: 120 }} />
            </div>
          </div>
        </div>

        {/* ─── Scheduler ─── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Scheduler</h2>
          <p className={styles.sectionDesc}>Control auto-publishing behavior.</p>
          <div className={`card ${styles.sectionCard}`}>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Scheduler enabled</span>
              <div className={styles.formToggle}>
                <button type="button" className={`${styles.toggle} ${settings.schedulerEnabled ? styles.on : ''}`} onClick={() => update('schedulerEnabled', !settings.schedulerEnabled)} />
                <span className={styles.toggleLabel}>{settings.schedulerEnabled ? 'On — posts auto-publish' : 'Off — posts stay pending'}</span>
              </div>
            </div>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Max retries</span>
              <input className={styles.formInput} type="number" value={settings.maxRetriesPerPost || 3} onChange={(e) => update('maxRetriesPerPost', parseInt(e.target.value) || 3)} style={{ width: 80 }} min="0" max="10" />
            </div>
          </div>
        </div>

        {/* ─── Registration ─── */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Registration</h2>
          <p className={styles.sectionDesc}>Control who can sign up.</p>
          <div className={`card ${styles.sectionCard}`}>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Registration open</span>
              <div className={styles.formToggle}>
                <button type="button" className={`${styles.toggle} ${settings.registrationEnabled ? styles.on : ''}`} onClick={() => update('registrationEnabled', !settings.registrationEnabled)} />
                <span className={styles.toggleLabel}>{settings.registrationEnabled ? 'On — anyone can sign in' : 'Off — new sign-ins blocked'}</span>
              </div>
            </div>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Allowed domains</span>
              <div>
                <input className={styles.formInput} value={settings.allowedEmailDomains || ''} onChange={(e) => update('allowedEmailDomains', e.target.value)} placeholder="company.com, agency.io" />
                <p className={styles.formHint}>Comma-separated. Leave empty to allow all domains.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Save ─── */}
        <div className={styles.actions}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save all settings'}
          </button>
          {msg && <span className={styles.successMsg}>{msg}</span>}
        </div>
      </div>
    </main>
  );
}
