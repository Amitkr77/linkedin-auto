import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import { createLinkedInPost } from '@/lib/linkedinService';
import { publicError } from '@/lib/api';

export async function POST(request) {
  try {
    const { ids, action } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No posts selected' }, { status: 400 });
    }
    if (ids.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 posts per bulk action' }, { status: 400 });
    }

    await connectDB();

    if (action === 'delete') {
      const result = await Post.deleteMany({
        _id: { $in: ids },
        status: { $in: ['DRAFT', 'PENDING', 'FAILED'] },
      });
      return NextResponse.json({ deleted: result.deletedCount });
    }

    if (action === 'publish') {
      const posts = await Post.find({
        _id: { $in: ids },
        status: 'PENDING',
      }).populate({ path: 'account', select: '+accessToken authorUrn tokenExpiresAt' });

      let published = 0;
      let failed = 0;

      for (const post of posts) {
        try {
          if (!post.account || post.account.tokenExpiresAt <= new Date()) {
            post.status = 'FAILED';
            post.errorMessage = 'Access token expired';
            await post.save();
            failed++;
            continue;
          }

          post.status = 'PROCESSING';
          await post.save();

          const urn = await createLinkedInPost(
            post.account.accessToken,
            post.account.authorUrn,
            post.commentary,
            post.mediaUrl
          );

          post.status = 'PUBLISHED';
          post.linkedinPostUrn = urn;
          await post.save();
          published++;
        } catch {
          post.status = 'FAILED';
          post.errorMessage = 'Bulk publish failed';
          await post.save();
          failed++;
        }
      }

      return NextResponse.json({ published, failed, total: posts.length });
    }

    return NextResponse.json({ error: 'Invalid action. Use "delete" or "publish".' }, { status: 400 });
  } catch (error) {
    return publicError(error, 'Bulk operation failed');
  }
}
