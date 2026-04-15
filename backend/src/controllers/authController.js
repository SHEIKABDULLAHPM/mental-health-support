import crypto from 'crypto';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { signAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/errors.js';

function normalizeUsername(fullName, email) {
  const base = (fullName || email || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `${base || 'user'}_${Math.floor(Math.random() * 10000)}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function register(req, res) {
  const { full_name, email, password, username } = req.body || {};
  if (!full_name || !email || !password) {
    throw new ApiError(400, 'full_name, email and password are required');
  }
  if (!validateEmail(email)) {
    throw new ApiError(400, 'Invalid email format');
  }
  if (String(password).length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const finalUsername = username || normalizeUsername(full_name, email);
  const usernameExists = await User.findOne({ username: finalUsername });
  if (usernameExists) {
    throw new ApiError(409, 'Username already in use');
  }
  const hash = await User.hashPassword(password);
  const user = await User.create({
    fullName: full_name,
    email: email.toLowerCase(),
    username: finalUsername,
    passwordHash: hash,
    role: 'user',
  });

  const tokenId = crypto.randomUUID();
  const accessToken = signAccessToken({ sub: String(user._id), role: user.role, tid: tokenId });
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await Session.create({
    userId: user._id,
    tokenId,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip,
    expiresAt,
  });

  return res.status(201).json({
    access_token: accessToken,
    token_type: 'bearer',
    user: {
      id: String(user._id),
      name: user.fullName,
      full_name: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      joinDate: user.createdAt,
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }
  if (!validateEmail(email)) {
    throw new ApiError(400, 'Invalid email format');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await user.verifyPassword(password);
  if (!valid || !user.isActive) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const tokenId = crypto.randomUUID();
  const accessToken = signAccessToken({ sub: String(user._id), role: user.role, tid: tokenId });
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await Session.create({
    userId: user._id,
    tokenId,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip,
    expiresAt,
  });

  return res.json({
    access_token: accessToken,
    token_type: 'bearer',
    user: {
      id: String(user._id),
      name: user.fullName,
      full_name: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      joinDate: user.createdAt,
    },
  });
}

export async function me(req, res) {
  const { user } = req.auth;
  return res.json({
    id: String(user._id),
    name: user.fullName,
    full_name: user.fullName,
    email: user.email,
    username: user.username,
    role: user.role,
    preferences: user.preferences,
    joinDate: user.createdAt,
  });
}

export async function profile(req, res) {
  return me(req, res);
}

export async function logout(req, res) {
  const tokenId = req?.auth?.payload?.tid;
  if (tokenId) {
    await Session.updateOne({ tokenId }, { $set: { revokedAt: new Date() } });
  }
  return res.json({ status: 'success', message: 'Logged out' });
}
