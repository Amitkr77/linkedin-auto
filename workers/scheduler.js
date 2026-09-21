import cron from 'node-cron';
import { connectDB } from '../lib/db.js';
import Post from '../lib/models/Post.js';
import { createLinkedInPost } from '../lib/linkedinService.js';

let running = false;

export async function runSchedulerTick() {
  if (running) return { skipped: true, processed: 0 };
  running = true;
  let processed = 0;
  console.log(`[CRON ${new Date().toISOString()}] Checking for pending posts...`);

  try {
    await connectDB();
    while (processed < 100) {
      const post = await Post.findOneAndUpdate(
        { ownerId: { $type: 'string' }, status: 'PENDING', scheduledAt: { $lte: new Date() } },
        { $set: { status: 'PROCESSING', errorMessage: null } },
        { new: true, sort: { scheduledAt: 1 } }
      ).populate({ path: 'account', select: '+accessToken authorUrn tokenExpiresAt ownerId' });
      if (!post) break;
      processed += 1;

      if (!post.account || post.account.ownerId !== post.ownerId) {
        post.status = 'FAILED';
        post.errorMessage = 'LinkedIn account not found';
        await post.save();
        continue;
      }
      if (new Date(post.account.tokenExpiresAt) < new Date()) {
        post.status = 'FAILED';
        post.errorMessage = 'Access token expired';
        await post.save();
        console.error(`[FAILED] Post ${post._id}: token expired`);
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
        await post.save();
        console.log(`[SUCCESS] Post ${post._id} -> ${urn}`);
      } catch (error) {
        post.status = 'FAILED';
        post.errorMessage = error.response?.data?.message || error.message;
        await post.save();
        console.error(`[FAILED] Post ${post._id}:`, post.errorMessage);
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
