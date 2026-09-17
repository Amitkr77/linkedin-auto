import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import Post from '@/lib/models/Post';
import { isObjectId, publicError } from '@/lib/api';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid account id' }, { status: 400 });
    await connectDB();
    const account = await Account.findById(id).select('-accessToken').lean();
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    return NextResponse.json(account);
  } catch (error) {
    return publicError(error, 'Unable to load account');
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid account id' }, { status: 400 });
    await connectDB();
    const account = await Account.findByIdAndDelete(id);
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    // Clean up pending/draft posts for this account
    await Post.deleteMany({ account: id, status: { $in: ['DRAFT', 'PENDING'] } });

    return NextResponse.json({ message: 'Account disconnected' });
  } catch (error) {
    return publicError(error, 'Unable to disconnect account');
  }
}
