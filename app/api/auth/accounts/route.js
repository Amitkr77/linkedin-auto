import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { getOwnerId, unauthorized } from '@/lib/currentUser';

export async function GET(request) {
  try {
    const ownerId = await getOwnerId(request);
    if (!ownerId) return unauthorized();
    await connectDB();
    const accounts = await Account.find({ ownerId })
      .select('authorUrn tokenExpiresAt createdAt accountType displayName profilePictureUrl email')
      .lean();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to list accounts:', error);
    return NextResponse.json({ error: 'Unable to load accounts' }, { status: 500 });
  }
}
