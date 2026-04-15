import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(payload) {
  const expiresIn = `${env.accessTokenExpireMinutes}m`;
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: env.jwtAlgorithm,
    expiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: [env.jwtAlgorithm],
  });
}
