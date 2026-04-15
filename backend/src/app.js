import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestContext } from './middleware/requestContext.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import wellnessRoutes from './routes/wellnessRoutes.js';
import preferencesRoutes from './routes/preferencesRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import positivityRoutes from './routes/positivityRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import emotionRoutes from './routes/emotionRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (env.allowedOrigins.includes(origin)) return cb(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return cb(null, true);
      return cb(new Error('CORS origin blocked'));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('tiny'));
app.use(requestContext);

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Mental Health Backend API' });
});

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/wellness', wellnessRoutes);
app.use('/api/v1/preferences', preferencesRoutes);
app.use('/api/v1/challenges', challengeRoutes);
app.use('/api/v1/positivity', positivityRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/emotion', emotionRoutes);

// Compatibility auth routes used by the current frontend.
app.use('/auth', authRoutes);

// Catch-all API gateway routes to preserve Python API contracts during migration.
app.use(proxyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
