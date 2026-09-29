import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { hashPassword } from '@/lib/adminAuth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Only allow setup if no admin exists yet
    const existingAdmin = await Admin.countDocuments();
    if (existingAdmin > 0) {
      return NextResponse.json(
        { success: false, message: 'Admin account already exists' },
        { status: 403 }
      );
    }

    const passwordHash = hashPassword(password);
    await Admin.create({
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    return NextResponse.json({ success: true, message: 'Admin account created' });
  } catch (error) {
    console.error('[ADMIN SETUP]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
