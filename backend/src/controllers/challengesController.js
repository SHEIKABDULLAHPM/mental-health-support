import mongoose from 'mongoose';
import { ApiError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { ChallengeCatalog } from '../models/ChallengeCatalog.js';
import { UserChallengeProgress } from '../models/UserChallengeProgress.js';

export async function listChallengeCatalog(req, res) {
  const rows = await ChallengeCatalog.find({ active: true }).sort({ createdAt: -1 });
  return sendSuccess(req, res, rows);
}

export async function createChallenge(req, res) {
  const payload = req.body || {};
  const row = await ChallengeCatalog.create({
    slug: String(payload.slug || '').trim(),
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    difficulty: payload.difficulty || 'easy',
    points: Number(payload.points || 10),
    target: Number(payload.target || 7),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    active: payload.active !== false,
  });
  return sendSuccess(req, res, row, { statusCode: 201 });
}

export async function listMyChallenges(req, res) {
  const { user } = req.auth;
  const rows = await UserChallengeProgress.find({ userId: user._id })
    .populate('challengeId')
    .sort({ updatedAt: -1 });
  return sendSuccess(req, res, rows);
}

export async function startChallenge(req, res) {
  const { user } = req.auth;
  const { challengeId } = req.body || {};

  if (!mongoose.isValidObjectId(challengeId)) {
    throw new ApiError(400, 'Valid challengeId is required');
  }

  const challenge = await ChallengeCatalog.findById(challengeId);
  if (!challenge || !challenge.active) {
    throw new ApiError(404, 'Challenge not found');
  }

  const row = await UserChallengeProgress.findOneAndUpdate(
    { userId: user._id, challengeId },
    {
      $setOnInsert: {
        target: challenge.target,
        progress: 0,
        state: 'active',
        startedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return sendSuccess(req, res, row);
}

export async function updateMyChallengeProgress(req, res) {
  const { user } = req.auth;
  const { id } = req.params;
  const { progress } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid progress id');
  }

  const row = await UserChallengeProgress.findOne({ _id: id, userId: user._id });
  if (!row) {
    throw new ApiError(404, 'Progress record not found');
  }

  const nextProgress = Number(progress);
  if (!Number.isFinite(nextProgress) || nextProgress < 0) {
    throw new ApiError(400, 'progress must be a non-negative number');
  }

  row.progress = nextProgress;
  if (row.progress >= row.target) {
    row.state = 'completed';
    row.completedAt = new Date();
  }
  await row.save();

  return sendSuccess(req, res, row);
}
