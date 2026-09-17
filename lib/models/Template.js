import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    category: { type: String, default: 'General', trim: true },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Template || mongoose.model('Template', templateSchema);
