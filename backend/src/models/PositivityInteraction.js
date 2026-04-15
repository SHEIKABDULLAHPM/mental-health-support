import mongoose from 'mongoose';

const positivityInteractionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PositivityContent', required: true, index: true },
    action: { type: String, enum: ['like', 'favorite', 'share', 'copy', 'view'], required: true, index: true },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

positivityInteractionSchema.index({ userId: 1, contentId: 1, action: 1, createdAt: -1 });

export const PositivityInteraction = mongoose.model('PositivityInteraction', positivityInteractionSchema);
