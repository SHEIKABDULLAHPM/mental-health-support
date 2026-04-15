import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    interests: { type: [String], default: [] },
    goals: { type: [String], default: [] },
    moodPatterns: { type: [String], default: [] },
    activityPreferences: { type: [String], default: [] },
    language: { type: String, default: 'en' },
    onboardingVersion: { type: String, default: 'v1' },
  },
  { timestamps: true }
);

export const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
