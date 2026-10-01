import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  token: { type: String, required: true, unique: true },
  createdBy: { type: String, required: true }, // admin email
  usedAt: { type: Date, default: null },
  usedBy: { type: String, default: null }, // ownerId of user who used it
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

inviteSchema.index({ token: 1 });
inviteSchema.index({ email: 1 });

export default mongoose.models.Invite || mongoose.model('Invite', inviteSchema);
