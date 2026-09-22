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
          To use a different account, first sign out at linkedin.com or open this page in a private browser window.
          LinkedIn may otherwise reuse the account already signed in to your browser.
        </p>
      </div>
    </main>
  );
}
