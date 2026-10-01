import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Invite from '@/lib/models/Invite';

// GET /api/invite/:token — validate invite token
export async function GET(request, { params }) {
  try {
    const { token } = await params;
    await connectDB();
    const invite = await Invite.findOne({ token, usedAt: null, expiresAt: { $gt: new Date() } }).lean();
    if (!invite) {
      return NextResponse.json({ valid: false, error: 'Invite is invalid or expired' });
    }
    return NextResponse.json({ valid: true, email: invite.email });
  } catch {
    return NextResponse.json({ valid: false, error: 'Failed to validate invite' }, { status: 500 });
  }
}
