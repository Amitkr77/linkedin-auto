import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import Post from '@/lib/models/Post';
import UserActivity from '@/lib/models/UserActivity';

export async function GET(request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const detailId = searchParams.get('userId'); // optional: get detailed activity for one user

    await connectDB();

    // ── Single user detail ──
    if (detailId) {
      const accounts = await Account.find({ ownerId: detailId }).lean();
      const postStats = await Post.aggregate([
        { $match: { ownerId: detailId } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          lastDate: { $max: '$createdAt' },
        }},
      ]);
      const recentPosts = await Post.find({ ownerId: detailId })
        .sort({ createdAt: -1 }).limit(10)
        .populate('account', 'displayName authorUrn').lean();
      const activities = await UserActivity.find({ ownerId: detailId })
        .sort({ createdAt: -1 }).limit(50).lean();
      const loginLocations = await UserActivity.aggregate([
        { $match: { ownerId: detailId, action: 'login', country: { $ne: null } } },
        { $group: { _id: { city: '$city', region: '$region', country: '$country' }, count: { $sum: 1 }, lastSeen: { $max: '$createdAt' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      const stats = {};
      for (const s of postStats) stats[s._id] = { count: s.count, lastDate: s.lastDate };

      return NextResponse.json({
        success: true,
        user: {
          ownerId: detailId,
          accounts,
          stats: {
            total: Object.values(stats).reduce((s, v) => s + v.count, 0),
            published: stats.PUBLISHED?.count || 0,
            pending: stats.PENDING?.count || 0,
            failed: stats.FAILED?.count || 0,
            drafts: stats.DRAFT?.count || 0,
          },
          recentPosts,
          activities,
          loginLocations: loginLocations.map((l) => ({
            city: l._id.city,
            region: l._id.region,
            country: l._id.country,
            count: l.count,
            lastSeen: l.lastSeen,
          })),
        },
      });
    }

    // ── All users overview ──
    const accounts = await Account.find({}).lean();
    const ownerIds = [...new Set(accounts.map((a) => a.ownerId).filter(Boolean))];

    const [postStats, activityStats, locationStats] = await Promise.all([
      Post.aggregate([
        { $match: { ownerId: { $in: ownerIds } } },
        { $group: {
          _id: '$ownerId',
          total: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          drafts: { $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] } },
          lastPostDate: { $max: '$publishedAt' },
        }},
      ]),
      UserActivity.aggregate([
        { $match: { ownerId: { $in: ownerIds } } },
        { $group: {
          _id: '$ownerId',
          totalActions: { $sum: 1 },
          lastActive: { $max: '$createdAt' },
          loginCount: { $sum: { $cond: [{ $eq: ['$action', 'login'] }, 1, 0] } },
        }},
      ]),
      UserActivity.aggregate([
        { $match: { ownerId: { $in: ownerIds }, action: 'login', country: { $ne: null } } },
        { $sort: { createdAt: -1 } },
        { $group: {
          _id: '$ownerId',
          lastCity: { $first: '$city' },
          lastRegion: { $first: '$region' },
          lastCountry: { $first: '$country' },
          lastTimezone: { $first: '$timezone' },
          lastIp: { $first: '$ip' },
        }},
      ]),
    ]);

    const postMap = {};
    for (const s of postStats) postMap[s._id] = s;
    const actMap = {};
    for (const a of activityStats) actMap[a._id] = a;
    const locMap = {};
    for (const l of locationStats) locMap[l._id] = l;

    const users = ownerIds.map((ownerId) => {
      const ownerAccounts = accounts.filter((a) => a.ownerId === ownerId);
      const primary = ownerAccounts[0];
      const ps = postMap[ownerId] || { total: 0, published: 0, pending: 0, failed: 0, drafts: 0, lastPostDate: null };
      const act = actMap[ownerId] || { totalActions: 0, lastActive: null, loginCount: 0 };
      const loc = locMap[ownerId] || {};

      return {
        ownerId,
        displayName: primary?.displayName || 'Unknown',
        email: primary?.email || 'N/A',
        authorUrn: primary?.authorUrn || 'N/A',
        profilePictureUrl: primary?.profilePictureUrl || null,
        connectedDate: primary?.createdAt || null,
        tokenExpiresAt: primary?.tokenExpiresAt || null,
        accountCount: ownerAccounts.length,
        // Posts
        total: ps.total,
        published: ps.published,
        pending: ps.pending,
        failed: ps.failed,
        drafts: ps.drafts,
        lastPostDate: ps.lastPostDate,
        // Activity
        totalActions: act.totalActions,
        lastActive: act.lastActive,
        loginCount: act.loginCount,
        // Location
        lastCity: loc.lastCity || null,
        lastRegion: loc.lastRegion || null,
        lastCountry: loc.lastCountry || null,
        lastTimezone: loc.lastTimezone || null,
        lastIp: loc.lastIp || null,
      };
    });

    const platformStats = {
      totalUsers: ownerIds.length,
      totalAccounts: accounts.length,
      totalPosts: users.reduce((s, u) => s + u.total, 0),
      totalPublished: users.reduce((s, u) => s + u.published, 0),
      totalPending: users.reduce((s, u) => s + u.pending, 0),
      totalFailed: users.reduce((s, u) => s + u.failed, 0),
      totalDrafts: users.reduce((s, u) => s + u.drafts, 0),
      totalLogins: users.reduce((s, u) => s + u.loginCount, 0),
      totalActions: users.reduce((s, u) => s + u.totalActions, 0),
    };

    return NextResponse.json({ success: true, users, platformStats });
  } catch (error) {
    console.error('[ADMIN USERS]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
