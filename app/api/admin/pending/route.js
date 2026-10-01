import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';

// GET /api/admin/pending — list users awaiting approval
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const pending = await Account.find({ status: 'PENDING' }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, users: pending });
  } catch (error) {
    console.error('[ADMIN PENDING]', error);
    return NextResponse.json({ error: 'Failed to load pending users' }, { status: 500 });
  }
}
