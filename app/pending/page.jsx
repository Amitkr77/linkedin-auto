'use client';

export default function PendingPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5EF', fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#171717', letterSpacing: '-0.02em', marginBottom: 12 }}>Account pending approval</h1>
        <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
          Your account has been created and is waiting for admin approval.
        </p>
        <p style={{ fontSize: 14, color: '#929292', lineHeight: 1.6, marginBottom: 32 }}>
          You will receive an email once your account is approved. This usually takes less than 24 hours.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#18392B', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Check again
          </button>
          <a href="/api/auth/signout" onClick={(e) => { e.preventDefault(); fetch('/api/auth/signout', { method: 'POST' }).then(() => window.location.replace('/sign-in')); }} style={{ padding: '10px 24px', background: 'transparent', color: '#666', border: '1.5px solid #E5E3DC', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', textDecoration: 'none', display: 'inline-block' }}>
            Sign out
          </a>
        </div>
      </div>
    </main>
  );
}
