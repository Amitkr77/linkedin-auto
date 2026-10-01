import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { sendEmail } from '@/lib/email';
import { getPlatformSettings } from '@/lib/platformCheck';

// POST /api/admin/approve — approve a pending user
export async function POST(request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { ownerId } = await request.json();
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 });

    await connectDB();
    const account = await Account.findOneAndUpdate(
      { ownerId, status: 'PENDING' },
      { $set: { status: 'ACTIVE' } },
      { new: true }
    );
    if (!account) return NextResponse.json({ error: 'Pending user not found' }, { status: 404 });

    // Send approval email
    const settings = await getPlatformSettings();
    const baseUrl = settings?.platformUrl || 'http://localhost:3000';
    if (account.email) {
      sendEmail({
        to: account.email,
        subject: `Your account has been approved — ${settings?.platformName || 'LinkedIn Automation'}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
            <div style="background: #18392B; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h2 style="color: #fff; margin: 0; font-size: 20px;">Account Approved!</h2>
            </div>
            <div style="background: #fff; border: 1px solid #E5E3DC; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="color: #2F6B4F; font-weight: 600; font-size: 16px; margin: 0 0 12px;">Welcome, ${account.displayName || 'there'}!</p>
              <p style="color: #666; font-size: 14px; margin: 0 0 24px;">Your account has been approved. You can now sign in and start scheduling posts.</p>
              <a href="${baseUrl}" style="display: inline-block; background: #18392B; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Go to Dashboard</a>
            </div>
          </div>
        `,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('[ADMIN APPROVE]', error);
    return NextResponse.json({ error: 'Failed to approve user' }, { status: 500 });
  }
}
