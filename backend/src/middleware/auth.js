import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      // eslint-disable-next-line no-console
      console.warn('[auth] missing bearer token', { requestId: req.requestId, path: req.originalUrl });
      return res.status(401).json({ status: 'error', error: 'Missing Bearer token' });
    }
    const token = auth.slice(7);
    const payload = verifyAccessToken(token);
    const session = await Session.findOne({ tokenId: payload.tid, userId: payload.sub });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      // eslint-disable-next-line no-console
      console.warn('[auth] expired or revoked session', { requestId: req.requestId, path: req.originalUrl, userId: payload?.sub });
      return res.status(401).json({ status: 'error', error: 'Session expired or revoked' });
    }
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      // eslint-disable-next-line no-console
      console.warn('[auth] invalid user session', { requestId: req.requestId, path: req.originalUrl, userId: payload?.sub });
      return res.status(401).json({ status: 'error', error: 'Invalid user session' });
    }
    req.auth = { token, payload, user, session };
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[auth] token verification failed', { requestId: req.requestId, path: req.originalUrl, error: error?.message });
    return res.status(401).json({ status: 'error', error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req?.auth?.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ status: 'error', error: 'Forbidden' });
    }
    return next();
  };
}
