import { sendSuccess } from '../utils/response.js';
import { RecommendationCatalog } from '../models/RecommendationCatalog.js';
import { RecommendationFeedback } from '../models/RecommendationFeedback.js';
import { UserPreference } from '../models/UserPreference.js';
import { JournalEntry } from '../models/JournalEntry.js';

function computeScore(item, pref, moodHint) {
  let score = 0.2;

  if (pref?.interests?.length) {
    const overlap = item.tags.filter((t) => pref.interests.includes(t)).length;
    score += overlap * 0.15;
  }

  if (pref?.activityPreferences?.length) {
    if (pref.activityPreferences.includes(item.itemType)) score += 0.25;
  }

  if (moodHint && Array.isArray(item.tags) && item.tags.includes(moodHint)) {
    score += 0.2;
  }

  return Number(Math.min(score, 0.99).toFixed(3));
}

export async function listRecommendationCatalog(req, res) {
  const { type = null, language = null, limit = 100 } = req.query;
  const query = { active: true };
  if (type) query.itemType = String(type).trim();
  if (language) query.language = String(language).trim();

  const rows = await RecommendationCatalog.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 100, 300));

  return sendSuccess(req, res, rows);
}

export async function createRecommendationCatalogItem(req, res) {
  const payload = req.body || {};
  const row = await RecommendationCatalog.create({
    itemType: payload.itemType,
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    language: payload.language || 'en',
    metadata: payload.metadata || {},
    active: payload.active !== false,
  });
  return sendSuccess(req, res, row, { statusCode: 201 });
}

export async function getPersonalizedRecommendations(req, res) {
  const { user } = req.auth;
  const topN = Math.min(Number(req.query.topN || 10), 30);
  const mood = req.query.mood ? String(req.query.mood).trim() : null;

  const [catalog, pref, recentJournal] = await Promise.all([
    RecommendationCatalog.find({ active: true }).limit(500),
    UserPreference.findOne({ userId: user._id }),
    JournalEntry.findOne({ userId: user._id }).sort({ createdAt: -1 }),
  ]);

  const moodHint = mood || recentJournal?.mood || null;

  const ranked = catalog
    .map((item) => ({
      item,
      score: computeScore(item, pref, moodHint),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((r) => ({
      id: String(r.item._id),
      itemType: r.item.itemType,
      title: r.item.title,
      description: r.item.description,
      tags: r.item.tags,
      metadata: r.item.metadata,
      score: r.score,
    }));

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(user._id)}`).emit('recommendations:update', {
      context: { mood: moodHint },
      recommendations: ranked,
      timestamp: new Date().toISOString(),
    });
  }

  return sendSuccess(req, res, {
    userId: String(user._id),
    context: { mood: moodHint },
    recommendations: ranked,
  });
}

export async function addRecommendationFeedback(req, res) {
  const { user } = req.auth;
  const { itemId, rating = null, action, context = {} } = req.body || {};

  const row = await RecommendationFeedback.create({
    userId: user._id,
    itemId,
    rating,
    action,
    context,
  });

  return sendSuccess(req, res, row, { statusCode: 201 });
}
