import mongoose from 'mongoose';
import { ApiError } from '../utils/errors.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { Reflection } from '../models/Reflection.js';
import { FutureLetter } from '../models/FutureLetter.js';

function parseLimit(raw, fallback = 20, max = 100) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

export async function listJournalEntries(req, res) {
  const { user } = req.auth;
  const limit = parseLimit(req.query.limit, 20, 200);
  const rows = await JournalEntry.find({ userId: user._id }).sort({ createdAt: -1 }).limit(limit);
  return res.json({ status: 'success', data: rows });
}

export async function createJournalEntry(req, res) {
  const { user } = req.auth;
  const { mood = null, content, sentiment = null } = req.body || {};
  if (!content || !String(content).trim()) {
    throw new ApiError(400, 'content is required');
  }

  const row = await JournalEntry.create({
    userId: user._id,
    mood: mood ? String(mood).trim() : null,
    content: String(content).trim(),
    sentiment,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(user._id)}`).emit('wellness:journal-created', {
      id: String(row._id),
      createdAt: row.createdAt,
    });
  }

  return res.status(201).json({ status: 'success', data: row });
}

export async function updateJournalEntry(req, res) {
  const { user } = req.auth;
  const { id } = req.params;
  const { mood, content, sentiment } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid journal entry id');
  }

  const row = await JournalEntry.findOne({ _id: id, userId: user._id });
  if (!row) {
    throw new ApiError(404, 'Journal entry not found');
  }

  if (content !== undefined) {
    if (!String(content).trim()) {
      throw new ApiError(400, 'content cannot be empty');
    }
    row.content = String(content).trim();
  }

  if (mood !== undefined) {
    row.mood = mood ? String(mood).trim() : null;
  }

  if (sentiment !== undefined) {
    row.sentiment = sentiment;
  }

  await row.save();
  return res.json({ status: 'success', data: row });
}

export async function deleteJournalEntry(req, res) {
  const { user } = req.auth;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid journal entry id');
  }

  const deleted = await JournalEntry.findOneAndDelete({ _id: id, userId: user._id });
  if (!deleted) {
    throw new ApiError(404, 'Journal entry not found');
  }

  return res.json({ status: 'success', data: { id, deleted: true } });
}

export async function listReflections(req, res) {
  const limit = parseLimit(req.query.limit, 50, 200);
  const category = req.query.category ? String(req.query.category).trim() : 'all';
  const query = category === 'all' ? {} : { category };
  const rows = await Reflection.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username');

  const data = rows.map((r) => ({
    id: String(r._id),
    text: r.text,
    category: r.category,
    reactions: r.reactions,
    anonymous: r.anonymous,
    sentiment: r.sentiment,
    createdAt: r.createdAt,
    user: r.anonymous ? null : r.userId,
  }));

  return res.json({ status: 'success', data });
}

export async function createReflection(req, res) {
  const { user } = req.auth;
  const { text, category = 'all', anonymous = true, sentiment = null } = req.body || {};
  if (!text || !String(text).trim()) {
    throw new ApiError(400, 'text is required');
  }

  const row = await Reflection.create({
    userId: user._id,
    text: String(text).trim(),
    category: String(category || 'all').trim(),
    anonymous: Boolean(anonymous),
    sentiment,
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('wellness:reflection-created', {
      id: String(row._id),
      category: row.category,
      createdAt: row.createdAt,
    });
  }

  return res.status(201).json({
    status: 'success',
    data: {
      id: String(row._id),
      text: row.text,
      category: row.category,
      reactions: row.reactions,
      anonymous: row.anonymous,
      sentiment: row.sentiment,
      createdAt: row.createdAt,
    },
  });
}

export async function addReflectionReaction(req, res) {
  const { id } = req.params;
  const { reaction } = req.body || {};
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid reflection id');
  }
  if (!['heart', 'smile', 'star'].includes(reaction)) {
    throw new ApiError(400, 'reaction must be one of heart, smile, star');
  }

  const row = await Reflection.findByIdAndUpdate(
    id,
    { $inc: { [`reactions.${reaction}`]: 1 } },
    { new: true }
  );

  if (!row) {
    throw new ApiError(404, 'Reflection not found');
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('wellness:reflection-reacted', {
      id: String(row._id),
      reactions: row.reactions,
    });
  }

  return res.json({ status: 'success', data: { id: String(row._id), reactions: row.reactions } });
}

export async function listFutureLetters(req, res) {
  const { user } = req.auth;
  const now = new Date();

  await FutureLetter.updateMany(
    { userId: user._id, status: 'scheduled', deliveryDate: { $lte: now } },
    { $set: { status: 'delivered', deliveredAt: now } }
  );

  const rows = await FutureLetter.find({ userId: user._id }).sort({ deliveryDate: 1 });
  return res.json({ status: 'success', data: rows });
}

export async function createFutureLetter(req, res) {
  const { user } = req.auth;
  const { title, content, deliveryDate } = req.body || {};
  if (!title || !String(title).trim()) throw new ApiError(400, 'title is required');
  if (!content || !String(content).trim()) throw new ApiError(400, 'content is required');
  if (!deliveryDate) throw new ApiError(400, 'deliveryDate is required');

  const parsedDate = new Date(deliveryDate);
  if (Number.isNaN(parsedDate.getTime())) throw new ApiError(400, 'deliveryDate must be a valid date');

  const row = await FutureLetter.create({
    userId: user._id,
    title: String(title).trim(),
    content: String(content).trim(),
    deliveryDate: parsedDate,
    status: parsedDate <= new Date() ? 'delivered' : 'scheduled',
    deliveredAt: parsedDate <= new Date() ? new Date() : null,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(user._id)}`).emit('wellness:future-letter-created', {
      id: String(row._id),
      deliveryDate: row.deliveryDate,
      status: row.status,
    });
  }

  return res.status(201).json({ status: 'success', data: row });
}
