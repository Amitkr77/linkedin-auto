import nodemailer from 'nodemailer';

const transporter = process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

/**
 * Send an email notification. Silently skips if SMTP is not configured.
 */
export async function sendEmail({ to, subject, html }) {
  if (!transporter || !to) return;
  try {
    await transporter.sendMail({
      from: `"LinkedIn Automation" <${process.env.SMTP_EMAIL}>`,
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
        <div style="background: #0b1f3a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">Post Published</h2>
        </div>
        <div style="background: #fff; border: 1px solid #e2e5ea; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #057642; font-weight: 600; font-size: 16px; margin: 0 0 12px;">Your post is now live on LinkedIn.</p>
          <div style="background: #f4f5f7; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #14181f; font-size: 14px; line-height: 1.6; margin: 0;">${escapeHtml(preview)}</p>
          </div>
          ${post.linkedinPostUrn ? `<p style="font-size: 12px; color: #5b6472;">URN: ${escapeHtml(post.linkedinPostUrn)}</p>` : ''}
          <p style="font-size: 12px; color: #5b6472; margin-top: 16px;">Published at: ${new Date(post.publishedAt || Date.now()).toLocaleString()}</p>
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
        <div style="background: #c0392b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">Post Failed</h2>
        </div>
        <div style="background: #fff; border: 1px solid #e2e5ea; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #c0392b; font-weight: 600; font-size: 16px; margin: 0 0 12px;">Your scheduled post could not be published.</p>
          <div style="background: #f4f5f7; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #14181f; font-size: 14px; line-height: 1.6; margin: 0;">${escapeHtml(preview)}</p>
          </div>
          <div style="background: #fee2e2; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #c0392b; font-size: 13px; margin: 0;"><strong>Error:</strong> ${escapeHtml(post.errorMessage || 'Unknown error')}</p>
          </div>
          <p style="font-size: 13px; color: #5b6472;">Sign in to your dashboard to retry or edit this post.</p>
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
        <div style="background: #fff; border: 1px solid #e2e5ea; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #854d0e; font-weight: 600; font-size: 16px; margin: 0 0 12px;">Your LinkedIn access token for ${escapeHtml(displayName || 'your account')} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.</p>
          <p style="font-size: 14px; color: #14181f; line-height: 1.6;">After expiry, your scheduled posts will fail to publish. Sign in again to refresh your token.</p>
          <p style="font-size: 13px; color: #5b6472; margin-top: 16px;">Visit your dashboard and click "Reconnect LinkedIn" on the Accounts page.</p>
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
