import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/otpStore';
import { createAdminSession, adminSessionCookieOptions } from '@/lib/adminSession';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const valid = verifyOtp(email, otp);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Create admin session
    const token = await createAdminSession({ email, role: 'admin' });
    const cookieStore = await cookies();
    cookieStore.set(adminSessionCookieOptions(token));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN VERIFY]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
