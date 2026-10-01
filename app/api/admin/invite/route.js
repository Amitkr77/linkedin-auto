import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { connectDB } from '@/lib/db';
import Invite from '@/lib/models/Invite';
import { sendEmail } from '@/lib/email';
import { getPlatformSettings } from '@/lib/platformCheck';

// GET /api/admin/invite — list all invites
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const invites = await Invite.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, invites });
  } catch (error) {
    console.error('[ADMIN INVITE LIST]', error);
    return NextResponse.json({ error: 'Failed to load invites' }, { status: 500 });
  }
}

// POST /api/admin/invite — create and send invite
export async function POST(request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    await connectDB();

    // Check if already invited and unused
    const existing = await Invite.findOne({ email: email.toLowerCase(), usedAt: null, expiresAt: { $gt: new Date() } });
    if (existing) {
      return NextResponse.json({ error: 'This email already has a pending invite' }, { status: 409 });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await Invite.create({
      email: email.toLowerCase(),
      token,
      createdBy: session.email,
      expiresAt,
    });

    // Build invite link
    const settings = await getPlatformSettings();
    const baseUrl = settings?.platformUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/invite/${token}`;

    // Send invite email
    await sendEmail({
      to: email,
      subject: `You're invited to ${settings?.platformName || 'LinkedIn Automation'}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: #18392B; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">You're Invited!</h2>
          </div>
          <div style="background: #fff; border: 1px solid #E5E3DC; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #171717; font-size: 16px; margin: 0 0 16px;">You've been invited to join <strong>${settings?.platformName || 'LinkedIn Automation'}</strong>.</p>
            <p style="color: #666; font-size: 14px; margin: 0 0 24px;">Click the button below to create your account. This invite expires in 7 days.</p>
            <a href="${inviteLink}" style="display: inline-block; background: #18392B; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Accept Invite</a>
            <p style="color: #929292; font-size: 12px; margin: 24px 0 0;">Or copy this link: ${inviteLink}</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, invite: { ...invite.toObject(), inviteLink } });
  } catch (error) {
    console.error('[ADMIN INVITE CREATE]', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
