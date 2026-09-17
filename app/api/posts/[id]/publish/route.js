import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import { createLinkedInPost } from '@/lib/linkedinService';
import { isObjectId, publicError } from '@/lib/api';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
    await connectDB();
    const post = await Post.findOneAndUpdate(
      { _id: id, status: 'PENDING' },
      { $set: { status: 'PROCESSING', errorMessage: null } },
      { new: true }
    ).populate({ path: 'account', select: '+accessToken authorUrn tokenExpiresAt' });
    if (!post) {
      return NextResponse.json({ error: 'Pending post not found or already being processed' }, { status: 409 });
    }
    if (!post.account || post.account.tokenExpiresAt <= new Date()) {
      post.status = 'FAILED';
      post.errorMessage = 'Access token expired';
      await post.save();
      return NextResponse.json({ error: 'Access token expired. Please re-authenticate.' }, { status: 401 });
    }

    const linkedinPostUrn = await createLinkedInPost(
      post.account.accessToken,
      post.account.authorUrn,
      post.commentary,
      post.mediaUrl
    );

    post.status = 'PUBLISHED';
    post.linkedinPostUrn = linkedinPostUrn;
    post.publishedAt = new Date();
    await post.save();

    return NextResponse.json(post);
  } catch (error) {
    const { id } = await params;
    if (isObjectId(id)) {
      await Post.updateOne(
        { _id: id, status: 'PROCESSING' },
        { $set: { status: 'FAILED', errorMessage: 'LinkedIn publish failed' } }
      ).catch(() => {});
    }
    return publicError(error, 'Unable to publish post');
  }
}
