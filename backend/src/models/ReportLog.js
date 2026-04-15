import mongoose from 'mongoose';

const reportLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    type: { type: String, required: true, index: true },
    level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const ReportLog = mongoose.model('ReportLog', reportLogSchema);
