import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    text: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    mode: { type: String, default: 'therapeutic' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    messages: { type: [messageSchema], default: [] },
    latestAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalysisResult', default: null },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
