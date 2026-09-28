import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import { getOwnerId, unauthorized } from '@/lib/currentUser';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// GET /api/analytics/best-times — analyze published posts to suggest best posting times
export async function GET(request) {
  try {
    const ownerId = await getOwnerId(request);
    if (!ownerId) return unauthorized();

    await connectDB();
    const posts = await Post.find({
      ownerId,
      status: 'PUBLISHED',
      publishedAt: { $ne: null },
    }).lean();

    if (posts.length < 3) {
      return NextResponse.json({ slots: [], message: 'Need at least 3 published posts to analyze.' });
    }

    // Group by day-of-week + hour, sum engagement
    const buckets = {};
    for (const post of posts) {
      const d = new Date(post.publishedAt);
      const day = d.getDay();
      const hour = d.getHours();
      const key = `${day}-${hour}`;
      if (!buckets[key]) buckets[key] = { day, hour, totalEngagement: 0, count: 0 };
      const a = post.analytics || {};
      buckets[key].totalEngagement += (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
      buckets[key].count += 1;
    }

    // Rank by average engagement, then by count as tiebreaker
    const ranked = Object.values(buckets)
      .map((b) => ({
        day: DAYS[b.day],
        dayIndex: b.day,
        hour: b.hour,
        label: `${DAYS[b.day]} ${b.hour.toString().padStart(2, '0')}:00`,
        avgEngagement: b.count > 0 ? Math.round(b.totalEngagement / b.count) : 0,
        postCount: b.count,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement || b.postCount - a.postCount)
      .slice(0, 5);

    return NextResponse.json({ slots: ranked });
  } catch (error) {
    console.error('[BEST TIMES ERROR]', error);
    return NextResponse.json({ error: 'Unable to analyze posting times' }, { status: 500 });
  }
}
