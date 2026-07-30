import { validationResult } from 'express-validator';
import { ApiError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { EmotionAnalysis } from '../models/EmotionAnalysis.js';
import { env } from '../config/env.js';

function normalizeEmotionPayload(payload, fallbackField = null) {
  if (!payload || typeof payload !== 'object') {
    return { primaryEmotion: null, confidence: 0 };
  }

  const primaryEmotion =
    payload.primary_emotion ||
    payload.dominant_emotion ||
    payload.emotion ||
    fallbackField ||
    null;

  const confidence = Number(payload.confidence || payload.score || 0) || 0;
  return { primaryEmotion, confidence };
}

async function callMlEndpoint(endpoint, formData, token) {
  const response = await fetch(`${env.mlServiceUrl}${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  const upstreamMessage = payload?.message || payload?.error || `ML request failed: ${endpoint}`;

  if (response.status === 503 || payload?.status === 'unavailable') {
    throw new ApiError(503, upstreamMessage, {
      upstreamStatus: payload?.status || 'unavailable',
      endpoint,
      upstream: payload,
    });
  }

  if (!response.ok || payload.status === 'error') {
    throw new ApiError(response.status || 502, upstreamMessage, {
      endpoint,
      upstream: payload,
    });
  }

  return payload;
}

export async function detectVoiceEmotion(req, res) {
  const { user } = req.auth;
  if (!req.file?.buffer) {
    throw new ApiError(400, 'audio file is required');
  }

  const formData = new FormData();
  formData.append('audio', new Blob([req.file.buffer]), req.file.originalname || 'recording.webm');

  const payload = await callMlEndpoint('/api/detect-emotion', formData, req.auth.token);
  const normalized = normalizeEmotionPayload(payload?.data || payload);

  const row = await EmotionAnalysis.create({
    userId: user._id,
    modality: 'voice',
    primaryEmotion: normalized.primaryEmotion,
    confidence: normalized.confidence,
    raw: payload,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(user._id)}`).emit('emotion:update', {
      id: String(row._id),
      modality: 'voice',
      primaryEmotion: row.primaryEmotion,
      confidence: row.confidence,
      createdAt: row.createdAt,
    });
  }

  return sendSuccess(req, res, {
    id: String(row._id),
    modality: 'voice',
    primaryEmotion: row.primaryEmotion,
    confidence: row.confidence,
    raw: payload,
    createdAt: row.createdAt,
  });
}

export async function detectFaceEmotion(req, res) {
  const { user } = req.auth;
  if (!req.file?.buffer) {
    throw new ApiError(400, 'image file is required');
  }

  const formData = new FormData();
  formData.append('image', new Blob([req.file.buffer]), req.file.originalname || 'capture.jpg');

  const payload = await callMlEndpoint('/detect-emotion', formData, req.auth.token);
  const normalized = normalizeEmotionPayload(payload?.data || payload);

  const row = await EmotionAnalysis.create({
    userId: user._id,
    modality: 'face',
    primaryEmotion: normalized.primaryEmotion,
    confidence: normalized.confidence,
    raw: payload,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(user._id)}`).emit('emotion:update', {
      id: String(row._id),
      modality: 'face',
      primaryEmotion: row.primaryEmotion,
      confidence: row.confidence,
      createdAt: row.createdAt,
    });
  }

  return sendSuccess(req, res, {
    id: String(row._id),
    modality: 'face',
    primaryEmotion: row.primaryEmotion,
    confidence: row.confidence,
    raw: payload,
    createdAt: row.createdAt,
  });
}

export async function listMyEmotionAnalyses(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { modality } = req.query;
  const query = { userId: user._id };
  if (modality) {
    query.modality = modality;
  }

  const rows = await EmotionAnalysis.find(query).sort({ createdAt: -1 }).limit(100);
  return sendSuccess(req, res, rows);
}
