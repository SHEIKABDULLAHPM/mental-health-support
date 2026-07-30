import { validationResult } from 'express-validator';
import { ApiError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { PositivityContent } from '../models/PositivityContent.js';
import { PositivityInteraction } from '../models/PositivityInteraction.js';

export async function listPositivityContent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { type, language, limit = 50 } = req.query;
  const query = { active: true };
  if (type) query.contentType = type;
  if (language) query.language = language;

  const rows = await PositivityContent.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit), 200));

  return sendSuccess(req, res, rows);
}

export async function createPositivityContent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const payload = req.body;
  const row = await PositivityContent.create({
    contentType: payload.contentType || 'quote',
    text: payload.text,
    author: payload.author || '',
    tags: payload.tags || [],
    language: payload.language || 'en',
    active: payload.active !== false,
  });

  return sendSuccess(req, res, row, { statusCode: 201 });
}

export async function addPositivityInteraction(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { contentId, action, context = {} } = req.body;

  const content = await PositivityContent.findById(contentId, { _id: 1 });
  if (!content) {
    throw new ApiError(404, 'Positivity content not found');
  }

  const row = await PositivityInteraction.create({
    userId: user._id,
    contentId,
    action,
    context,
  });

  return sendSuccess(req, res, row, { statusCode: 201 });
}

export async function listMyPositivityInteractions(req, res) {
  const { user } = req.auth;
  const rows = await PositivityInteraction.find({ userId: user._id })
    .populate('contentId')
    .sort({ createdAt: -1 })
    .limit(200);

  return sendSuccess(req, res, rows);
}
