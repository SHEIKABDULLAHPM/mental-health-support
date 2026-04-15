import mongoose from 'mongoose';

const reflectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true },
    category: { type: String, default: 'all', trim: true },
    sentiment: { type: mongoose.Schema.Types.Mixed, default: null },
    reactions: {
      heart: { type: Number, default: 0 },
      smile: { type: Number, default: 0 },
      star: { type: Number, default: 0 },
    },
    anonymous: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Reflection = mongoose.model('Reflection', reflectionSchema);
