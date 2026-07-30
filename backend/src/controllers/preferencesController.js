import { validationResult } from 'express-validator';
import { ApiError } from '../utils/errors.js';
import { UserPreference } from '../models/UserPreference.js';
import { sendSuccess } from '../utils/response.js';

export async function getMyPreferences(req, res) {
  const { user } = req.auth;
  let pref = await UserPreference.findOne({ userId: user._id });
  if (!pref) {
    pref = await UserPreference.create({ userId: user._id });
  }
  return sendSuccess(req, res, pref);
}

export async function upsertMyPreferences(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const payload = req.body;

  const update = {
    interests: payload.interests,
    goals: payload.goals,
    moodPatterns: payload.moodPatterns,
    activityPreferences: payload.activityPreferences,
    language: payload.language,
    onboardingVersion: payload.onboardingVersion,
  };

  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

  const pref = await UserPreference.findOneAndUpdate(
    { userId: user._id },
    { $set: update },
    { new: true, upsert: true }
  );

  return sendSuccess(req, res, pref);
}
