import mongoose from 'mongoose';

const recommendationCatalogSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['book', 'music', 'activity', 'challenge', 'breathing', 'positivity', 'nature-sound'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    language: { type: String, default: 'en' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const RecommendationCatalog = mongoose.model('RecommendationCatalog', recommendationCatalogSchema);
