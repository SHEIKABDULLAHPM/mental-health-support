import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.BACKEND_PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://mongodb:27017/mental_health',
  mongoDbName: process.env.MONGO_DB_NAME || 'mental_health',
  jwtSecret: process.env.JWT_SECRET_KEY || 'change-this-in-production',
  jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
  accessTokenExpireMinutes: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 1440),
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://ml-service:5000',
  llmServiceUrl: process.env.LLM_API_URL || 'http://llm-service:11434',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:80,http://localhost:5173')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
};
