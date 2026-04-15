import mongoose from 'mongoose';

const analysisResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    messageText: { type: String, required: true },
    sentiment: { type: mongoose.Schema.Types.Mixed, default: null },
    emotion: { type: mongoose.Schema.Types.Mixed, default: null },
    risk: { type: mongoose.Schema.Types.Mixed, default: null },
    llmMeta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const AnalysisResult = mongoose.model('AnalysisResult', analysisResultSchema);
