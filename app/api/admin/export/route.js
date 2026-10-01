import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import Post from '@/lib/models/Post';
import Template from '@/lib/models/Template';
import UserActivity from '@/lib/models/UserActivity';

// GET /api/admin/export — full platform data backup as JSON
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const [accounts, posts, templates, activities] = await Promise.all([
      Account.find({}).select('-accessToken').lean(),
      Post.find({}).lean(),
      Template.find({}).lean(),
      UserActivity.find({}).sort({ createdAt: -1 }).limit(5000).lean(),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      platform: 'LinkedIn Automation',
      stats: {
        accounts: accounts.length,
        posts: posts.length,
        templates: templates.length,
        activities: activities.length,
      },
      data: { accounts, posts, templates, activities },
    };

    const json = JSON.stringify(backup, null, 2);
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error('[ADMIN EXPORT]', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
