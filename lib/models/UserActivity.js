import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  action: {
    type: String,
    required: true,
    enum: ['login', 'post_created', 'post_published', 'post_failed', 'post_deleted', 'post_edited', 'post_imported', 'post_duplicated', 'template_created', 'template_deleted'],
    index: true,
  },
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  // Geo
  city: { type: String, default: null },
  region: { type: String, default: null },
  country: { type: String, default: null },
  timezone: { type: String, default: null },
  // Device info (parsed from user-agent)
  device: { type: String, default: null },       // mobile, tablet, desktop
  browser: { type: String, default: null },       // Chrome, Safari, Firefox, etc.
  os: { type: String, default: null },            // Windows, macOS, iOS, Android, Linux
  // Request context
  language: { type: String, default: null },      // from Accept-Language
  referrer: { type: String, default: null },      // from Referer header
  // Extra
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

userActivitySchema.index({ createdAt: -1 });
userActivitySchema.index({ ownerId: 1, createdAt: -1 });

export default mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);
