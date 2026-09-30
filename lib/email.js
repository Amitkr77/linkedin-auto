import nodemailer from 'nodemailer';
import { connectDB } from './db.js';

// Cache the transporter so we don't query DB on every email
let _transporter = null;
let _lastCheck = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTransporter() {
  const now = Date.now();
  if (_transporter && now - _lastCheck < CACHE_TTL) return _transporter;

  // Try DB settings first (admin panel), fall back to env vars
  let smtpEmail = process.env.SMTP_EMAIL;
  let smtpPassword = process.env.SMTP_PASSWORD;

  try {
    await connectDB();
    const Settings = (await import('./models/Settings.js')).default;
    const settings = await Settings.findById('platform').lean();
    if (settings?.smtpEmail && settings?.smtpPassword && settings.emailNotificationsEnabled !== false) {
      smtpEmail = settings.smtpEmail;
      smtpPassword = settings.smtpPassword;
    }
    if (settings?.emailNotificationsEnabled === false) {
      _transporter = null;
      _lastCheck = now;
      return null;
    }
  } catch {
    // DB not available — fall back to env vars
  }

  if (!smtpEmail || !smtpPassword) {
    _transporter = null;
    _lastCheck = now;
    return null;
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpEmail, pass: smtpPassword },
  });
  _lastCheck = now;
  return _transporter;
}

// Force cache refresh (called after admin saves settings)
export function clearEmailCache() {
  _transporter = null;
  _lastCheck = 0;
}

/**
 * Send an email notification. Silently skips if SMTP is not configured.
 */
export async function sendEmail({ to, subject, html }) {
  const transporter = await getTransporter();
  if (!transporter || !to) return;
  try {
    const smtpEmail = transporter.options?.auth?.user || process.env.SMTP_EMAIL;
    await transporter.sendMail({
      from: `"LinkedIn Automation" <${smtpEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  } catch (error) {
    console.warn(`[EMAIL] Failed to send to ${to}:`, error.message);
  }
}

/**
 * Notify user when a post is published successfully.
 */
export async function notifyPostPublished(post, email) {
  const preview = post.commentary.slice(0, 100) + (post.commentary.length > 100 ? '…' : '');
  await sendEmail({
    to: email,
    subject: 'Your LinkedIn post was published!',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <div style="background: #18392B; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">Post Published</h2>
        </div>
        <div style="background: #fff; border: 1px solid #E5E3DC; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #2F6B4F; font-weight: 600; font-size: 16px; margin: 0 0 12px;">Your post is now live on LinkedIn.</p>
          <div style="background: #F7F5EF; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #171717; font-size: 14px; line-height: 1.6; margin: 0;">${escapeHtml(preview)}</p>
          </div>
          ${post.linkedinPostUrn ? `<p style="font-size: 12px; color: #929292;">URN: ${escapeHtml(post.linkedinPostUrn)}</p>` : ''}
          <p style="font-size: 12px; color: #929292; margin-top: 16px;">Published at: ${new Date(post.publishedAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
      </div>
    `,
  });
}

/**
 * Notify user when a post fails permanently.
 */
export async function notifyPostFailed(post, email) {
  const preview = post.commentary.slice(0, 100) + (post.commentary.length > 100 ? '…' : '');
  await sendEmail({
    to: email,
    subject: 'LinkedIn post failed to publish',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <div style="background: #C94A4A; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">Post Failed</h2>
        </div>
        <div style="background: #fff; border: 1px solid #E5E3DC; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #C94A4A; font-weight: 600; font-size: 16px; margin: 0 0 12px;">Your scheduled post could not be published.</p>
          <div style="background: #F7F5EF; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #171717; font-size: 14px; line-height: 1.6; margin: 0;">${escapeHtml(preview)}</p>
          </div>
          <div style="background: #FEE2E2; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #C94A4A; font-size: 13px; margin: 0;"><strong>Error:</strong> ${escapeHtml(post.errorMessage || 'Unknown error')}</p>
          </div>
          <p style="font-size: 13px; color: #666;">Sign in to your dashboard to retry or edit this post.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Notify user when their LinkedIn token is about to expire.
 */
export async function notifyTokenExpiring(email, displayName, daysLeft) {
  await sendEmail({
    to: email,
    subject: `LinkedIn token expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <div style="background: #d68910; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">Token Expiring Soon</h2>
        </div>
        <div style="background: #fff; border: 1px solid #E5E3DC; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #854d0e; font-weight: 600; font-size: 16px; margin: 0 0 12px;">Your LinkedIn access token for ${escapeHtml(displayName || 'your account')} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.</p>
          <p style="font-size: 14px; color: #171717; line-height: 1.6;">After expiry, your scheduled posts will fail to publish. Sign in again to refresh your token.</p>
        </div>
      </div>
    `,
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
