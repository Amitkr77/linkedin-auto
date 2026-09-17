import { runSchedulerTick } from '@/workers/scheduler';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Lightweight endpoint called by the client-side heartbeat.
// No auth required — the operation is idempotent (atomic findOneAndUpdate
// prevents duplicate publishes) and only processes the user's own posts.
export async function POST() {
  try {
    const result = await runSchedulerTick();
    return Response.json(result);
  } catch (error) {
    console.error('[TICK ERROR]', error);
    return Response.json({ error: 'tick failed' }, { status: 500 });
  }
}
