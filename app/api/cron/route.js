import crypto from 'node:crypto';
import { runSchedulerTick } from '@/workers/scheduler';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    return Response.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  const expected = crypto.createHash('sha256').update(`Bearer ${secret}`).digest();
  const actual = crypto.createHash('sha256').update(request.headers.get('authorization') || '').digest();
  if (!crypto.timingSafeEqual(expected, actual)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runSchedulerTick();
    return Response.json(result);
  } catch (error) {
    console.error('[VERCEL CRON ERROR]', error);
    return Response.json({ error: 'Scheduler failed; inspect the function logs' }, { status: 500 });
  }
}
