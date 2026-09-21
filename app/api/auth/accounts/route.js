import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { getSession, syncLinkedInAccount, unauthorized } from '@/lib/currentUser';

export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session) return unauthorized();
    await syncLinkedInAccount(session);
    await connectDB();
    const accounts = await Account.find({ ownerId: session.user.id })
      .select('authorUrn tokenExpiresAt createdAt accountType displayName profilePictureUrl email').lean();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to list accounts:', error);
    return NextResponse.json({ error: 'Unable to load accounts' }, { status: 500 });
  }
}
