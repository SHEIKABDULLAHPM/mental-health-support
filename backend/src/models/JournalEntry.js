import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mood: { type: String, default: null, trim: true },
    content: { type: String, required: true, trim: true },
    sentiment: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
