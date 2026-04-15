export function sendSuccess(req, res, data = {}, options = {}) {
  const statusCode = options.statusCode || 200;
  const meta = {
    requestId: req.requestId,
    version: 'v1',
    ...(options.meta || {}),
  };

  return res.status(statusCode).json({
    success: true,
    status: 'success',
    data,
    meta,
  });
}

export function sendError(req, res, statusCode, code, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    status: 'error',
    error: {
      code,
      message,
      details,
      requestId: req.requestId,
    },
    detail: message,
    details,
  });
}
