import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { sendEmail } from '@/lib/email';
import { getPlatformSettings } from '@/lib/platformCheck';

// POST /api/admin/reject — reject a pending user
export async function POST(request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { ownerId, reason } = await request.json();
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 });

    await connectDB();
    const account = await Account.findOneAndUpdate(
      { ownerId, status: 'PENDING' },
      { $set: { status: 'REJECTED' } },
      { new: true }
    );
    if (!account) return NextResponse.json({ error: 'Pending user not found' }, { status: 404 });

    // Send rejection email
    const settings = await getPlatformSettings();
    if (account.email) {
      sendEmail({
        to: account.email,
        subject: `Account update — ${settings?.platformName || 'LinkedIn Automation'}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
            <div style="background: #C94A4A; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h2 style="color: #fff; margin: 0; font-size: 20px;">Account Not Approved</h2>
            </div>
            <div style="background: #fff; border: 1px solid #E5E3DC; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="color: #171717; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">Hi ${account.displayName || 'there'},</p>
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">Unfortunately, your account request was not approved at this time.${reason ? ` Reason: ${reason}` : ''}</p>
            </div>
          </div>
        `,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('[ADMIN REJECT]', error);
    return NextResponse.json({ error: 'Failed to reject user' }, { status: 500 });
  }
}
