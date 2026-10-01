'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function InvitePage() {
  const params = useParams();
  const token = params.token;
  const [status, setStatus] = useState('loading'); // loading, valid, invalid
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) { setStatus('valid'); setEmail(data.email); }
        else setStatus('invalid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const accept = () => {
    // Set invite token cookie then redirect to LinkedIn OAuth
    document.cookie = `invite_token=${token};path=/;max-age=600;samesite=lax`;
    window.location.href = '/api/auth/signin';
  };

  if (status === 'loading') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5EF' }}>
        <p style={{ color: '#929292', fontFamily: 'Inter, sans-serif' }}>Validating invite...</p>
      </main>
    );
  }

  if (status === 'invalid') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5EF', fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FEE2E2', color: '#C94A4A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#171717', marginBottom: 12 }}>Invite expired or invalid</h1>
          <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>This invite link is no longer valid. It may have expired or already been used. Contact the admin for a new invite.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5EF', fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#D1FAE5', color: '#2F6B4F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#171717', letterSpacing: '-0.02em', marginBottom: 12 }}>You're invited!</h1>
        <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6, marginBottom: 8 }}>
          You've been invited to join the platform.
        </p>
        {email && <p style={{ fontSize: 14, color: '#929292', marginBottom: 24 }}>Invite sent to: <strong style={{ color: '#171717' }}>{email}</strong></p>}
        <button onClick={accept} style={{ padding: '14px 36px', background: '#18392B', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
          Accept & sign in with LinkedIn
        </button>
        <p style={{ fontSize: 12, color: '#929292', marginTop: 16 }}>You'll be redirected to LinkedIn to authorize your account.</p>
      </div>
    </main>
  );
}
