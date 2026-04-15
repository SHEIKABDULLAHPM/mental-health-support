import mongoose from 'mongoose';

const futureLetterSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    deliveryDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['scheduled', 'delivered'], default: 'scheduled' },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const FutureLetter = mongoose.model('FutureLetter', futureLetterSchema);
