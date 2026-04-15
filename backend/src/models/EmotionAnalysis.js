import mongoose from 'mongoose';

const emotionAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    modality: { type: String, enum: ['voice', 'face'], required: true, index: true },
    primaryEmotion: { type: String, default: null },
    confidence: { type: Number, default: 0 },
    raw: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

emotionAnalysisSchema.index({ userId: 1, modality: 1, createdAt: -1 });

export const EmotionAnalysis = mongoose.model('EmotionAnalysis', emotionAnalysisSchema);
