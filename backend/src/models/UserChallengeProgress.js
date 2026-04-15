import mongoose from 'mongoose';

const userChallengeProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChallengeCatalog', required: true, index: true },
    progress: { type: Number, default: 0 },
    target: { type: Number, default: 0 },
    state: { type: String, enum: ['active', 'completed', 'archived'], default: 'active', index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userChallengeProgressSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

export const UserChallengeProgress = mongoose.model('UserChallengeProgress', userChallengeProgressSchema);
