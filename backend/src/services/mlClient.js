import axios from 'axios';
import { env } from '../config/env.js';

const ml = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: 180000,
});

const llm = axios.create({
  baseURL: env.llmServiceUrl,
  timeout: 180000,
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableError(error) {
  const status = error?.response?.status;
  if (!status) return true;
  return status >= 500 || status === 429;
}

async function withRetry(label, fn, maxAttempts = 3, baseDelayMs = 250) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const started = Date.now();
      const result = await fn();
      // eslint-disable-next-line no-console
      console.info('[mlClient] upstream success', {
        label,
        attempt,
        latencyMs: Date.now() - started,
      });
      return result;
    } catch (error) {
      lastError = error;
      const retryable = isRetryableError(error);
      // eslint-disable-next-line no-console
      console.warn('[mlClient] upstream attempt failed', {
        label,
        attempt,
        retryable,
        status: error?.response?.status,
        message: error?.message,
      });
      if (!retryable || attempt >= maxAttempts) {
        break;
      }
      const delayMs = baseDelayMs * (2 ** (attempt - 1));
      // eslint-disable-next-line no-await-in-loop
      await sleep(delayMs);
    }
  }

  throw lastError;
}

export async function sendChatToMl({ token, message, conversationId, mode, temperature, sentiment, history, userId }) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const payload = {
    message,
    conversation_id: conversationId,
    user_id: userId,
    mode,
    temperature,
    max_tokens: 256,
    history,
    sentiment,
  };

  try {
    const llmRes = await withRetry('llm:/api/chat', () => llm.post(
      '/api/chat',
      payload,
      { headers }
    ));
    return { source: 'llm', data: llmRes.data };
  } catch (llmError) {
    // eslint-disable-next-line no-console
    console.warn('[mlClient] falling back to legacy ML chat endpoint', {
      message: llmError?.message,
      status: llmError?.response?.status,
    });
    const legacyRes = await withRetry('llm:/api/chat/send', () => llm.post(
      '/api/chat/send',
      {
        ...payload,
        max_length: 256,
      },
      { headers }
    ));
    return { source: 'legacy', data: legacyRes.data };
  }
}
