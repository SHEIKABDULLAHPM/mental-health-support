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
  const { user } = req.auth;
  const payload = req.body || {};

  const update = {
    interests: Array.isArray(payload.interests) ? payload.interests : undefined,
    goals: Array.isArray(payload.goals) ? payload.goals : undefined,
    moodPatterns: Array.isArray(payload.moodPatterns) ? payload.moodPatterns : undefined,
    activityPreferences: Array.isArray(payload.activityPreferences) ? payload.activityPreferences : undefined,
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
