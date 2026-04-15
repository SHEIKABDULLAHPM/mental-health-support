import mongoose from 'mongoose';

const positivityContentSchema = new mongoose.Schema(
  {
    contentType: { type: String, enum: ['quote', 'affirmation', 'prompt'], default: 'quote' },
    text: { type: String, required: true, trim: true },
    author: { type: String, default: '' },
    tags: { type: [String], default: [] },
    language: { type: String, default: 'en' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PositivityContent = mongoose.model('PositivityContent', positivityContentSchema);
