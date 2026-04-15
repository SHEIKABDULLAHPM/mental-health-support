import { ApiError } from '../utils/errors.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';

const ALLOWED_THEMES = new Set(['light', 'dark']);
const ALLOWED_LANGUAGES = new Set(['en', 'es', 'fr', 'de', 'ar', 'hi', 'ta']);

export async function getCurrentUser(req, res) {
  const { user } = req.auth;
  return res.json({
    status: 'success',
    data: {
      id: String(user._id),
      name: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      preferences: user.preferences,
      joinDate: user.createdAt,
    },
  });
}

export async function updateMyPreferences(req, res) {
  const { user } = req.auth;
  const { notifications, theme, language } = req.body || {};

  if (theme !== undefined && !ALLOWED_THEMES.has(String(theme))) {
    throw new ApiError(400, 'theme must be one of: light, dark');
  }
  if (language !== undefined && !ALLOWED_LANGUAGES.has(String(language))) {
    throw new ApiError(400, 'Unsupported language');
  }
  if (notifications !== undefined && typeof notifications !== 'boolean') {
    throw new ApiError(400, 'notifications must be a boolean');
  }

  if (theme !== undefined) user.preferences.theme = String(theme);
  if (language !== undefined) user.preferences.language = String(language);
  if (notifications !== undefined) user.preferences.notifications = notifications;

  await user.save();

  return res.json({
    status: 'success',
    data: {
      preferences: user.preferences,
      updatedAt: user.updatedAt,
    },
  });
}

export async function updateMyProfile(req, res) {
  const { user } = req.auth;
  const { full_name, username } = req.body || {};

  if (full_name !== undefined) {
    const value = String(full_name).trim();
    if (value.length < 2) {
      throw new ApiError(400, 'full_name must be at least 2 characters');
    }
    user.fullName = value;
  }

  if (username !== undefined) {
    const value = String(username).trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(value)) {
      throw new ApiError(400, 'username must be 3-30 characters and contain only letters, numbers, underscore');
    }
    const exists = await User.findOne({ username: value, _id: { $ne: user._id } }, { _id: 1 });
    if (exists) {
      throw new ApiError(409, 'Username already in use');
    }
    user.username = value;
  }

  await user.save();

  return res.json({
    status: 'success',
    data: {
      id: String(user._id),
      name: user.fullName,
      full_name: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      preferences: user.preferences,
      updatedAt: user.updatedAt,
    },
  });
}

export async function changeMyPassword(req, res) {
  const { user } = req.auth;
  const { current_password, new_password } = req.body || {};

  if (!current_password || !new_password) {
    throw new ApiError(400, 'current_password and new_password are required');
  }
  if (String(new_password).length < 8) {
    throw new ApiError(400, 'new_password must be at least 8 characters');
  }

  const valid = await user.verifyPassword(String(current_password));
  if (!valid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.passwordHash = await User.hashPassword(String(new_password));
  await user.save();

  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return res.json({
    status: 'success',
    data: { changed: true },
  });
}

export async function deactivateMyAccount(req, res) {
  const { user, payload } = req.auth;
  const { password } = req.body || {};

  if (!password) {
    throw new ApiError(400, 'password is required');
  }

  const valid = await user.verifyPassword(String(password));
  if (!valid) {
    throw new ApiError(401, 'Invalid password');
  }

  user.isActive = false;
  await user.save();

  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  if (payload?.tid) {
    await Session.updateOne({ tokenId: payload.tid }, { $set: { revokedAt: new Date() } });
  }

  return res.json({
    status: 'success',
    data: { deactivated: true },
  });
}
