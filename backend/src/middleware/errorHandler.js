import { ApiError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';

export function notFound(req, res) {
  return sendError(req, res, 404, 'ROUTE_NOT_FOUND', `Route not found: ${req.originalUrl}`);
}

export function errorHandler(err, req, res, next) {
  // Express body-parser throws SyntaxError for invalid JSON payloads.
  const isBadJson = err instanceof SyntaxError && err.status === 400 && 'body' in err;
  const statusCode = isBadJson ? 400 : err instanceof ApiError ? err.statusCode : 500;
  const message = isBadJson ? 'Invalid JSON payload' : err.message || 'Internal server error';
  const code = isBadJson ? 'BAD_REQUEST' : err instanceof ApiError ? 'API_ERROR' : 'INTERNAL_ERROR';
  const details = err instanceof ApiError ? err.details : null;

  if (statusCode >= 500) {
    // Keep a concise server-side trace for reliability diagnostics.
    // eslint-disable-next-line no-console
    console.error('[errorHandler] request failed', {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
      message,
    });
  }

  return sendError(req, res, statusCode, code, message, details);
}
