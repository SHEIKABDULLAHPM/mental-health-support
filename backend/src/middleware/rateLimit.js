const buckets = new Map();

function nowMs() {
  return Date.now();
}

function pruneOldHits(entry, windowMs) {
  const cutoff = nowMs() - windowMs;
  while (entry.hits.length > 0 && entry.hits[0] < cutoff) {
    entry.hits.shift();
  }
}

export function createRateLimiter({ windowMs = 60_000, maxRequests = 30 } = {}) {
  return function rateLimit(req, res, next) {
    const key = `${req.ip || 'unknown'}:${req.originalUrl}`;
    let entry = buckets.get(key);
    if (!entry) {
      entry = { hits: [] };
      buckets.set(key, entry);
    }

    pruneOldHits(entry, windowMs);

    if (entry.hits.length >= maxRequests) {
      return res.status(429).json({
        status: 'error',
        error: 'Too many requests. Please try again later.',
      });
    }

    entry.hits.push(nowMs());
    return next();
  };
}

export function authRateLimiter(maxRequests = 30, windowMs = 60_000) {
  return createRateLimiter({ windowMs, maxRequests });
}
