import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { getOwnerId } from '@/lib/currentUser';

// POST /api/beacon — receives client-side context (screen size, etc.)
// Stores it on the Account model for admin visibility
export async function POST(request) {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return Response.json({ ok: false }, { status: 401 });

    const body = await request.json();
    const screenWidth = Number(body.screenWidth) || null;
    const screenHeight = Number(body.screenHeight) || null;

    if (!screenWidth || !screenHeight) return Response.json({ ok: true });

    await connectDB();
    await Account.updateMany(
      { ownerId },
      { $set: { lastScreenSize: `${screenWidth}x${screenHeight}` } }
    );

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
