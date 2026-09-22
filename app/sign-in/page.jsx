'use client';
import { signIn } from '@/lib/auth-client';
import styles from './page.module.css';

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Brand panel */}
        <div className={styles.brandPanel}>
          <div className={styles.brandEyebrow}>
            <span className={styles.brandDot} />
            LinkedIn Automation
          </div>
          <h1 className={styles.brandHeadline}>
            Plan a month of LinkedIn posts in an afternoon.
          </h1>
          <p className={styles.brandSub}>
            Draft, queue and publish from one calendar — then let it run.
          </p>
          <div className={styles.tiles}>
            <div className={styles.tile} />
            <div className={styles.tile} />
            <div className={styles.tile} />
            <div className={styles.tile} />
            <div className={styles.tile} />
            <div className={styles.tile} />
            <div className={styles.tile} />
            <div className={styles.tile} />
          </div>
          <p className={styles.brandFooter}>
            Protected by Google and LinkedIn OAuth. Your credentials never touch our servers.
          </p>
        </div>

        {/* Sign-in card */}
        <div className={styles.signInPanel}>
          <span className={styles.signInEyebrow}>Sign in</span>
          <h2 className={styles.signInTitle}>Welcome back</h2>
          <p className={styles.signInSub}>
            Sign in with Google to access your workspace and manage your scheduled posts.
          </p>
          <button
            className={`btn btn-primary ${styles.signInBtn}`}
            onClick={() => signIn.social({
              provider: 'google',
              callbackURL: '/',
              additionalParams: { prompt: 'select_account' },
            })}
          >
            Continue with Google
          </button>
          <div className={styles.helperBox}>
            <svg className={styles.helperIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className={styles.helperText}>
              After signing in, connect the LinkedIn account you want to publish from on the Accounts page.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
