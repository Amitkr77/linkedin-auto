import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import Post from '@/lib/models/Post';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all accounts
    const accounts = await Account.find({}).lean();

    // Get all unique ownerIds
    const ownerIds = [...new Set(accounts.map((a) => a.ownerId).filter(Boolean))];

    // Aggregate post stats per ownerId
    const postStats = await Post.aggregate([
      { $match: { ownerId: { $in: ownerIds } } },
      {
        $group: {
          _id: '$ownerId',
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] },
          },
          drafts: {
            $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] },
          },
          lastPostDate: { $max: '$publishedAt' },
        },
      },
    ]);

    const statsMap = {};
    for (const stat of postStats) {
      statsMap[stat._id] = stat;
    }

    // Build user list — one entry per ownerId
    const users = ownerIds.map((ownerId) => {
      const ownerAccounts = accounts.filter((a) => a.ownerId === ownerId);
      const primaryAccount = ownerAccounts[0];
      const stats = statsMap[ownerId] || {
        total: 0,
        published: 0,
        pending: 0,
        failed: 0,
        drafts: 0,
        lastPostDate: null,
      };

      return {
        ownerId,
        displayName: primaryAccount?.displayName || 'Unknown',
        email: primaryAccount?.email || 'N/A',
        authorUrn: primaryAccount?.authorUrn || 'N/A',
        connectedDate: primaryAccount?.createdAt || null,
        accountCount: ownerAccounts.length,
        total: stats.total,
        published: stats.published,
        pending: stats.pending,
        failed: stats.failed,
        drafts: stats.drafts,
        lastPostDate: stats.lastPostDate,
      };
    });

    // Platform-wide totals
    const platformStats = {
      totalUsers: ownerIds.length,
      totalAccounts: accounts.length,
      totalPosts: users.reduce((s, u) => s + u.total, 0),
      totalPublished: users.reduce((s, u) => s + u.published, 0),
      totalPending: users.reduce((s, u) => s + u.pending, 0),
      totalFailed: users.reduce((s, u) => s + u.failed, 0),
      totalDrafts: users.reduce((s, u) => s + u.drafts, 0),
    };

    return NextResponse.json({ success: true, users, platformStats });
  } catch (error) {
    console.error('[ADMIN USERS]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
