import mongoose from 'mongoose';

// Single-document collection for platform-wide admin settings
const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'platform' },
  // SMTP / Email
  smtpEmail: { type: String, default: '' },
  smtpPassword: { type: String, default: '' },
  emailNotificationsEnabled: { type: Boolean, default: true },
  // Platform
  platformName: { type: String, default: 'LinkedIn Automation' },
  platformUrl: { type: String, default: '' },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are currently under maintenance. Please check back shortly.' },
  // User limits
  maxPostsPerUser: { type: Number, default: 500 },
  maxTemplatesPerUser: { type: Number, default: 50 },
  // Scheduler
  schedulerEnabled: { type: Boolean, default: true },
  maxRetriesPerPost: { type: Number, default: 3 },
  // Registration
  registrationEnabled: { type: Boolean, default: true },
  allowedEmailDomains: { type: String, default: '' }, // comma-separated, empty = allow all
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
