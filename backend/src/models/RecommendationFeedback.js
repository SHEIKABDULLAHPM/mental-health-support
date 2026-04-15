import mongoose from 'mongoose';

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecommendationCatalog', required: true, index: true },
    rating: { type: Number, default: null },
    action: { type: String, enum: ['clicked', 'completed', 'dismissed', 'viewed'], required: true, index: true },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

recommendationFeedbackSchema.index({ userId: 1, itemId: 1, createdAt: -1 });

export const RecommendationFeedback = mongoose.model('RecommendationFeedback', recommendationFeedbackSchema);
