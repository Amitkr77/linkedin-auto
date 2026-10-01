import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'platform' },

  // ── Email / SMTP ──
  smtpEmail: { type: String, default: '' },
  smtpPassword: { type: String, default: '' },
  emailNotificationsEnabled: { type: Boolean, default: true },

  // ── Platform ──
  platformName: { type: String, default: 'LinkedIn Automation' },
  platformUrl: { type: String, default: '' },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are currently under maintenance. Please check back shortly.' },

  // ── Branding ──
  logoUrl: { type: String, default: '' },
  brandColor: { type: String, default: '#18392B' },
  faviconUrl: { type: String, default: '' },

  // ── Announcement ──
  announcementEnabled: { type: Boolean, default: false },
  announcementText: { type: String, default: '' },
  announcementType: { type: String, enum: ['info', 'warning', 'success'], default: 'info' },

  // ── User limits ──
  maxPostsPerUser: { type: Number, default: 500 },
  maxTemplatesPerUser: { type: Number, default: 50 },

  // ── Scheduler ──
  schedulerEnabled: { type: Boolean, default: true },
  maxRetriesPerPost: { type: Number, default: 3 },

  // ── Registration / Access ──
  registrationMode: { type: String, enum: ['open', 'approval', 'invite'], default: 'open' },
  registrationEnabled: { type: Boolean, default: true }, // legacy — kept for backward compat
  allowedEmailDomains: { type: String, default: '' },

  // ── Security ──
  sessionTimeoutDays: { type: Number, default: 60 },
  maxSessionsPerUser: { type: Number, default: 5 },
  ipBlacklist: { type: String, default: '' },

  // ── Data management ──
  autoDeleteFailedDays: { type: Number, default: 0 },   // 0 = never
  autoDeletePublishedDays: { type: Number, default: 0 }, // 0 = never
  dataRetentionActivityDays: { type: Number, default: 90 },

}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
