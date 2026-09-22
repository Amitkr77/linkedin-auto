'use client';
import { signIn } from '@/lib/auth-client';

export default function SignInPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, textAlign: 'center', padding: 36 }}>
        <h1 style={{ marginBottom: 10 }}>LinkedIn Automation</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Sign in with LinkedIn to schedule and manage your own posts.
        </p>
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={() => signIn.social({
            provider: 'linkedin',
            callbackURL: '/',
            // LinkedIn otherwise silently reuses its existing browser SSO session.
            additionalParams: { prompt: 'login' },
          })}
        >
          Continue with LinkedIn
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 18 }}>
          Signing out here also signs this browser out of linkedin.com so that the next person must authenticate again.
        </p>
      </div>
    </main>
  );
}
