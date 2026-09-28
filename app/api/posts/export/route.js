import ExcelJS from 'exceljs';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import { getOwnerId, unauthorized } from '@/lib/currentUser';

export const runtime = 'nodejs';

// GET /api/posts/export — download all posts as Excel
export async function GET(request) {
  try {
    const ownerId = await getOwnerId(request);
    if (!ownerId) return unauthorized();

    await connectDB();
    const posts = await Post.find({ ownerId })
      .sort({ scheduledAt: -1 })
      .populate('account', 'authorUrn displayName')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Posts');

    sheet.columns = [
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Post Text', key: 'commentary', width: 50 },
      { header: 'Scheduled At', key: 'scheduledAt', width: 20 },
      { header: 'Published At', key: 'publishedAt', width: 20 },
      { header: 'Account', key: 'account', width: 25 },
      { header: 'LinkedIn URN', key: 'linkedinPostUrn', width: 30 },
      { header: 'Likes', key: 'likes', width: 8 },
      { header: 'Comments', key: 'comments', width: 10 },
      { header: 'Shares', key: 'shares', width: 8 },
      { header: 'Error', key: 'error', width: 30 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };

    for (const post of posts) {
      sheet.addRow({
        status: post.status,
        commentary: post.commentary,
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString() : '',
        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : '',
        account: post.account?.displayName || post.account?.authorUrn || '',
        linkedinPostUrn: post.linkedinPostUrn || '',
        likes: post.analytics?.likes || 0,
        comments: post.analytics?.comments || 0,
        shares: post.analytics?.shares || 0,
        error: post.errorMessage || '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="linkedin-posts-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[EXPORT ERROR]', error);
    return Response.json({ error: 'Export failed' }, { status: 500 });
  }
}
