import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';

export async function GET() {
  try {
    await connectDB();
    const accounts = await Account.find().select('authorUrn tokenExpiresAt createdAt').lean();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to list accounts:', error);
    return NextResponse.json({ error: 'Unable to load accounts' }, { status: 500 });
  }
}
