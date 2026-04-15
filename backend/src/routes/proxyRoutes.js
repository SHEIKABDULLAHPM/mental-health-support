import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { env } from '../config/env.js';

const router = Router();

const proxyDefaults = {
  changeOrigin: true,
  xfwd: true,
  proxyTimeout: 120000,
  timeout: 120000,
  on: {
    proxyReq: fixRequestBody,
    proxyRes(proxyRes, req) {
      // eslint-disable-next-line no-console
      console.info('[proxy] upstream response', {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: proxyRes.statusCode,
      });
    },
    error(err, req, res) {
      // eslint-disable-next-line no-console
      console.error('[proxy] upstream request failed', {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        message: err?.message,
      });

      if (res.headersSent) return;
      res.status(503).json({
        success: false,
        status: 'error',
        error: {
          code: 'UPSTREAM_UNAVAILABLE',
          message: 'ML service unavailable',
          details: err?.message || null,
          requestId: req.requestId,
        },
        detail: 'ML service unavailable',
        details: err?.message || null,
      });
    },
  },
};

// Preserve all existing ML API contracts under /api/* for frontend compatibility.
router.use(
  '/api',
  createProxyMiddleware({
    ...proxyDefaults,
    target: env.mlServiceUrl,
    pathRewrite: (path) => `/api${path}`,
  })
);

export default router;
