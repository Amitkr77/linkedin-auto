import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { getOwnerId } from '@/lib/currentUser';

// GET /api/auth/status — returns the user's account status
export async function GET() {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return NextResponse.json({ status: 'unauthenticated' });
    await connectDB();
    const account = await Account.findOne({ ownerId }).select('status').lean();
    if (!account) return NextResponse.json({ status: 'no_account' });
    return NextResponse.json({ status: account.status || 'ACTIVE' });
  } catch {
    return NextResponse.json({ status: 'ACTIVE' }); // fail open
  }
}
