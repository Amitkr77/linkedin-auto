import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { connectDB } from '@/lib/db';
import Settings from '@/lib/models/Settings';

// GET /api/admin/settings — load platform settings
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    let settings = await Settings.findById('platform').lean();
    if (!settings) {
      settings = await Settings.create({ _id: 'platform' });
      settings = settings.toObject();
    }
    // Mask password for display (show first 4 chars only)
    if (settings.smtpPassword) {
      settings.smtpPasswordMasked = settings.smtpPassword.slice(0, 4) + '••••••••';
    }
    delete settings.smtpPassword;
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[ADMIN SETTINGS GET]', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// PUT /api/admin/settings — update platform settings
export async function PUT(request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    await connectDB();

    const allowed = [
      'smtpEmail', 'smtpPassword', 'emailNotificationsEnabled',
      'platformName', 'platformUrl', 'maintenanceMode', 'maintenanceMessage',
      'maxPostsPerUser', 'maxTemplatesPerUser',
      'schedulerEnabled', 'maxRetriesPerPost',
      'registrationEnabled', 'allowedEmailDomains',
    ];

    const update = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    // Don't overwrite password if the masked version is sent back
    if (update.smtpPassword && update.smtpPassword.includes('••••')) {
      delete update.smtpPassword;
    }

    const settings = await Settings.findByIdAndUpdate(
      'platform',
      { $set: update },
      { new: true, upsert: true }
    ).lean();

    // Mask password in response
    if (settings.smtpPassword) {
      settings.smtpPasswordMasked = settings.smtpPassword.slice(0, 4) + '••••••••';
    }
    delete settings.smtpPassword;

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[ADMIN SETTINGS PUT]', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

// POST /api/admin/settings/test-email — send a test email
export async function POST(request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const settings = await Settings.findById('platform').lean();
    if (!settings?.smtpEmail || !settings?.smtpPassword) {
      return NextResponse.json({ error: 'SMTP not configured. Save email and password first.' }, { status: 400 });
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: settings.smtpEmail, pass: settings.smtpPassword },
    });

    await transporter.sendMail({
      from: `"${settings.platformName || 'LinkedIn Automation'}" <${settings.smtpEmail}>`,
      to: session.email,
      subject: 'Test email from admin panel',
      html: `<div style="font-family:sans-serif;padding:24px;"><h2>It works!</h2><p>SMTP is configured correctly.</p></div>`,
    });

    return NextResponse.json({ success: true, message: `Test email sent to ${session.email}` });
  } catch (error) {
    console.error('[ADMIN TEST EMAIL]', error);
    return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 });
  }
}
