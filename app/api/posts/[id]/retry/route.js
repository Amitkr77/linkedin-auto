import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import { isObjectId, publicError } from '@/lib/api';
import { getOwnerId, unauthorized } from '@/lib/currentUser';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId(request);
    if (!ownerId) return unauthorized();
    if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });

    await connectDB();
    const post = await Post.findOneAndUpdate(
      { _id: id, ownerId, status: 'FAILED' },
      { $set: { status: 'PENDING', errorMessage: null, scheduledAt: new Date() } },
      { new: true }
    );

    if (!post) {
      return NextResponse.json({ error: 'Failed post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return publicError(error, 'Unable to retry post');
  }
}
