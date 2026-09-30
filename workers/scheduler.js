import cron from 'node-cron';
import { connectDB } from '../lib/db.js';
import Post from '../lib/models/Post.js';
import { createLinkedInPost } from '../lib/linkedinService.js';
import { notifyPostPublished, notifyPostFailed } from '../lib/email.js';
import { trackActivity } from '../lib/activity.js';

const MAX_RETRIES = 3;

function isTransientError(error) {
  const status = error.response?.status;
  if (!status) return true; // network error / timeout
  return status === 429 || status >= 500;
}

let running = false;

export async function runSchedulerTick() {
  if (running) return { skipped: true, processed: 0 };
  running = true;
  let processed = 0;
  console.log(`[CRON ${new Date().toISOString()}] Checking for pending posts...`);

  try {
    await connectDB();

    // Recovery: reset posts stuck in PROCESSING for more than 5 minutes back to PENDING
    const stuckCutoff = new Date(Date.now() - 5 * 60 * 1000);
    const stuckResult = await Post.updateMany(
      { status: 'PROCESSING', updatedAt: { $lte: stuckCutoff } },
      { $set: { status: 'PENDING', errorMessage: 'Recovered from stuck PROCESSING state' } }
    );
    if (stuckResult.modifiedCount > 0) {
      console.log(`[CRON] Recovered ${stuckResult.modifiedCount} stuck PROCESSING post(s)`);
    }

    while (processed < 100) {
      const post = await Post.findOneAndUpdate(
        { ownerId: { $type: 'string' }, status: 'PENDING', scheduledAt: { $lte: new Date() } },
        { $set: { status: 'PROCESSING', errorMessage: null } },
        { new: true, sort: { scheduledAt: 1 } }
      ).populate({ path: 'account', select: '+accessToken authorUrn tokenExpiresAt ownerId email displayName' });
      if (!post) break;
      processed += 1;

      // Permanent failure: account missing or ownership mismatch
      if (!post.account || post.account.ownerId !== post.ownerId) {
        post.status = 'FAILED';
        post.errorMessage = 'LinkedIn account not found';
        await post.save();
        continue;
      }
      // Permanent failure: token expired
      if (new Date(post.account.tokenExpiresAt) < new Date()) {
        post.status = 'FAILED';
        post.errorMessage = 'Access token expired — sign in again to refresh';
        await post.save();
        console.error(`[FAILED] Post ${post._id}: token expired`);
        if (post.account.email) notifyPostFailed(post, post.account.email).catch(() => {});
        continue;
      }

      try {
        const urn = await createLinkedInPost(
          post.account.accessToken,
          post.account.authorUrn,
          post.commentary,
          post.mediaUrl
        );
        post.status = 'PUBLISHED';
        post.linkedinPostUrn = urn;
        post.publishedAt = new Date();
        post.retryCount = 0;
        await post.save();
        console.log(`[SUCCESS] Post ${post._id} -> ${urn}`);
        // Notifications (non-blocking)
        const email = post.account.email || null;
        if (email) notifyPostPublished(post, email).catch(() => {});
        trackActivity({ ownerId: post.ownerId, action: 'post_published', metadata: { postId: post._id.toString(), auto: true } }).catch(() => {});
      } catch (error) {
        const transient = isTransientError(error);
        const retries = (post.retryCount || 0) + 1;

        if (transient && retries <= MAX_RETRIES) {
          // Retry with exponential backoff: 5min, 10min, 20min
          const delayMs = retries * 5 * 60 * 1000;
          post.status = 'PENDING';
          post.scheduledAt = new Date(Date.now() + delayMs);
          post.retryCount = retries;
          post.errorMessage = `Retry ${retries}/${MAX_RETRIES}: ${error.response?.data?.message || error.message}`;
          await post.save();
          console.warn(`[RETRY ${retries}/${MAX_RETRIES}] Post ${post._id} rescheduled in ${retries * 5}min`);
        } else {
          // Permanent failure or max retries exhausted
          post.status = 'FAILED';
          post.errorMessage = error.response?.data?.message || error.message;
          await post.save();
          console.error(`[FAILED] Post ${post._id}:`, post.errorMessage);
          if (post.account?.email) notifyPostFailed(post, post.account.email).catch(() => {});
          trackActivity({ ownerId: post.ownerId, action: 'post_failed', metadata: { postId: post._id.toString(), error: post.errorMessage } }).catch(() => {});
        }
      }
    }
    if (processed) console.log(`[CRON] Processed ${processed} due post(s).`);
    return { skipped: false, processed };
  } catch (error) {
    console.error('[CRON ERROR]', error);
    throw error;
  } finally {
    running = false;
  }
}

export async function startScheduler() {
  await connectDB();
  cron.schedule('* * * * *', () => {
    runSchedulerTick().catch((error) => console.error('[CRON TASK ERROR]', error));
  });
  console.log('[CRON] Scheduler started - polling every 60s.');
}
