import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    ownerId: { type: String, index: true },
    authorUrn: { type: String, required: true, unique: true },
    status: { type: String, enum: ['ACTIVE', 'PENDING', 'REJECTED'], default: 'ACTIVE', index: true },
    accessToken: { type: String, required: true, select: false },
    tokenExpiresAt: { type: Date, required: true },
    accountType: { type: String, enum: ['person', 'organization'], default: 'person' },
    displayName: { type: String, default: null },
    profilePictureUrl: { type: String, default: null },
    headline: { type: String, default: null },
    email: { type: String, default: null },
    // For organization accounts — links to the person who connected it
    linkedPersonUrn: { type: String, default: null },
    lastScreenSize: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Account || mongoose.model('Account', accountSchema);
