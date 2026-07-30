import { validationResult } from 'express-validator';
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const payload = req.body;
  const row = await ChallengeCatalog.create({
    slug: payload.slug,
    title: payload.title,
    description: payload.description || '',
    difficulty: payload.difficulty || 'easy',
    points: payload.points || 10,
    target: payload.target || 7,
    tags: payload.tags || [],
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { challengeId } = req.body;

  const challenge = await ChallengeCatalog.findById(challengeId);
  if (!challenge || !challenge.active) {
    throw new ApiError(404, 'Challenge not found or not active');
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { id } = req.params;
  const { progress } = req.body;

  const row = await UserChallengeProgress.findOne({ _id: id, userId: user._id });
  if (!row) {
    throw new ApiError(404, 'Progress record not found');
  }

  row.progress = progress;
  if (row.progress >= row.target) {
    row.state = 'completed';
    row.completedAt = new Date();
  }
  await row.save();

  return sendSuccess(req, res, row);
}
