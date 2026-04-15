import mongoose from 'mongoose';

const challengeCatalogSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    points: { type: Number, default: 10 },
    target: { type: Number, default: 7 },
    active: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const ChallengeCatalog = mongoose.model('ChallengeCatalog', challengeCatalogSchema);
