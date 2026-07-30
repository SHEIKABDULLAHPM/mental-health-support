import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { Conversation } from '../models/Conversation.js';
import { AnalysisResult } from '../models/AnalysisResult.js';
import { ReportLog } from '../models/ReportLog.js';
import { sendChatToMl } from '../services/mlClient.js';
import { ApiError } from '../utils/errors.js';
import { env } from '../config/env.js';

function parseNdjsonLine(line) {
  if (!line || !line.trim()) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function writeNdjson(res, payload) {
  res.write(`${JSON.stringify(payload)}\n`);
}

function initStreamHeaders(res) {
  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

function mapMlToAssistantPayload(mlPayload) {
  const envelope = mlPayload?.data || {};
  const data = envelope?.data && typeof envelope.data === 'object' ? envelope.data : envelope;
  const assistant = data.assistant_message || data.response || 'I am here to support you.';
  return {
    assistant,
    sentiment: data.sentiment || null,
    emotion: data.emotion || null,
    risk: data.risk || (data.crisis ? { level: 'high' } : null),
    meta: {
      model: data.model || data.model_info?.model || 'unknown',
      source: mlPayload?.source || 'unknown',
      rag: data.rag || null,
      raw: data,
    },
  };
}

export async function sendMessage(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { message, conversation_id, mode = 'therapeutic', sentiment = null, temperature = 0.7 } = req.body;

  let conversation = null;
  if (conversation_id) {
    conversation = await Conversation.findOne({ _id: conversation_id, userId: user._id });
  }
  if (!conversation) {
    conversation = await Conversation.create({
      userId: user._id,
      mode,
      title: String(message).slice(0, 60),
      messages: [],
    });
  }

  const prevMessages = [...conversation.messages];
  conversation.messages.push({ sender: 'user', text: String(message).trim(), createdAt: new Date() });

  const history = prevMessages.map((m) => ({
    role: m.sender === 'assistant' ? 'assistant' : 'user',
    content: m.text,
  }));

  let mlPayload = null;
  try {
      mlPayload = await sendChatToMl({
        token: req.auth.token,
        message: String(message).trim(),
        conversationId: String(conversation._id),
        userId: String(user._id),
        mode,
        temperature,
        sentiment,
        history,
      });
  } catch (error) {
    await ReportLog.create({
      userId: user._id,
      type: 'chat_ml_error',
      level: 'error',
      message: 'ML/LLM service request failed',
      data: { error: error.message },
    });
    throw new ApiError(503, 'Chat service unavailable', { upstream: error.message });
  }

  const normalized = mapMlToAssistantPayload(mlPayload);
  conversation.messages.push({
    sender: 'assistant',
    text: normalized.assistant,
    meta: normalized.meta,
    createdAt: new Date(),
  });

  const analysis = await AnalysisResult.create({
    userId: user._id,
    conversationId: conversation._id,
    messageText: String(message).trim(),
    sentiment: normalized.sentiment,
    emotion: normalized.emotion,
    risk: normalized.risk,
    llmMeta: normalized.meta,
  });

  conversation.latestAnalysisId = analysis._id;
  await conversation.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(user._id)}`).emit('chat:message', {
      conversationId: String(conversation._id),
      userMessage: String(message).trim(),
      assistantMessage: normalized.assistant,
      analysis: {
        sentiment: normalized.sentiment,
        emotion: normalized.emotion,
        risk: normalized.risk,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    status: 'success',
    data: {
      conversation_id: String(conversation._id),
      user_message: String(message).trim(),
      assistant_message: normalized.assistant,
      timestamp: new Date().toISOString(),
      sentiment: normalized.sentiment,
      emotion: normalized.emotion,
      risk: normalized.risk,
      model_info: normalized.meta,
    },
  });
}

export async function streamMessage(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { message, conversation_id, mode = 'therapeutic', sentiment = null, temperature = 0.7 } = req.body;

  let conversation = null;
  if (conversation_id) {
    conversation = await Conversation.findOne({ _id: conversation_id, userId: user._id });
  }
  if (!conversation) {
    conversation = await Conversation.create({
      userId: user._id,
      mode,
      title: String(message).slice(0, 60),
      messages: [],
    });
  }

  const userMessageText = String(message).trim();
  const prevMessages = [...conversation.messages];
  conversation.messages.push({ sender: 'user', text: userMessageText, createdAt: new Date() });

  const history = prevMessages.map((m) => ({
    role: m.sender === 'assistant' ? 'assistant' : 'user',
    content: m.text,
  }));

  initStreamHeaders(res);
  writeNdjson(res, {
    type: 'meta',
    conversation_id: String(conversation._id),
    started_at: new Date().toISOString(),
  });

  let assistantText = '';
  let donePayload = null;
  let streamed = false;

  try {
    const upstream = await fetch(`${env.llmServiceUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.auth.token ? { Authorization: `Bearer ${req.auth.token}` } : {}),
      },
      body: JSON.stringify({
        message: userMessageText,
        conversation_id: String(conversation._id),
        user_id: String(user._id),
        mode,
        temperature,
        max_tokens: 256,
        sentiment,
        history,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      throw new Error(`LLM stream upstream returned HTTP ${upstream.status}`);
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const event = parseNdjsonLine(rawLine);
        if (!event) continue;

        if (event.type === 'token') {
          const token = event.token || '';
          if (token) {
            streamed = true;
            assistantText += token;
            writeNdjson(res, { type: 'token', token, conversation_id: String(conversation._id) });
          }
          continue;
        }

        if (event.type === 'done') {
          donePayload = event;
          if (!assistantText) {
            assistantText = event.assistant_message || event.response || '';
          }
          continue;
        }

        if (event.type === 'error') {
          throw new Error(event.error || 'LLM stream failed');
        }
      }
    }
  } catch (streamError) {
    // Fallback to regular non-stream chat path.
    try {
      const fallbackPayload = await sendChatToMl({
        token: req.auth.token,
        message: userMessageText,
        conversationId: String(conversation._id),
        userId: String(user._id),
        mode,
        temperature,
        sentiment,
        history,
      });

      const normalizedFallback = mapMlToAssistantPayload(fallbackPayload);
      assistantText = normalizedFallback.assistant;
      donePayload = {
        type: 'done',
        assistant_message: normalizedFallback.assistant,
        response: normalizedFallback.assistant,
        risk: normalizedFallback.risk,
        model: normalizedFallback.meta?.model,
        fallback: true,
        fallback_reason: streamError.message,
      };

      if (!streamed && assistantText) {
        writeNdjson(res, { type: 'token', token: assistantText, conversation_id: String(conversation._id), fallback: true });
      }
    } catch (fallbackError) {
      await ReportLog.create({
        userId: user._id,
        type: 'chat_stream_error',
        level: 'error',
        message: 'Chat stream and fallback both failed',
        data: {
          streamError: streamError.message,
          fallbackError: fallbackError.message,
        },
      });

      writeNdjson(res, {
        type: 'error',
        error: 'Chat service unavailable',
        details: fallbackError.message,
      });
      res.end();
      return;
    }
  }

  const normalized = {
    assistant: assistantText || 'I am here to support you.',
    sentiment: donePayload?.sentiment || null,
    emotion: donePayload?.emotion || null,
    risk: donePayload?.risk || null,
    meta: {
      model: donePayload?.model || 'unknown',
      source: donePayload?.fallback ? 'fallback' : 'stream',
      rag: donePayload?.rag || null,
      raw: donePayload || {},
    },
  };

  conversation.messages.push({
    sender: 'assistant',
    text: normalized.assistant,
    meta: normalized.meta,
    createdAt: new Date(),
  });

  const analysis = await AnalysisResult.create({
    userId: user._id,
    conversationId: conversation._id,
    messageText: userMessageText,
    sentiment: normalized.sentiment,
    emotion: normalized.emotion,
    risk: normalized.risk,
    llmMeta: normalized.meta,
  });

  conversation.latestAnalysisId = analysis._id;
  await conversation.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(user._id)}`).emit('chat:message', {
      conversationId: String(conversation._id),
      userMessage: userMessageText,
      assistantMessage: normalized.assistant,
      analysis: {
        sentiment: normalized.sentiment,
        emotion: normalized.emotion,
        risk: normalized.risk,
      },
      timestamp: new Date().toISOString(),
    });
  }

  writeNdjson(res, {
    type: 'done',
    conversation_id: String(conversation._id),
    user_message: userMessageText,
    assistant_message: normalized.assistant,
    timestamp: new Date().toISOString(),
    sentiment: normalized.sentiment,
    emotion: normalized.emotion,
    risk: normalized.risk,
    rag: normalized.meta.rag,
    model_info: normalized.meta,
    streamed,
    fallback: Boolean(donePayload?.fallback),
  });
  res.end();
}

export async function listMyConversations(req, res) {
  const { user } = req.auth;
  const rows = await Conversation.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(100);
  return res.json({ status: 'success', data: rows });
}

export async function getMyConversation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { id } = req.params;
  const row = await Conversation.findOne({ _id: id, userId: user._id });
  if (!row) {
    throw new ApiError(404, 'Conversation not found');
  }
  return res.json({ status: 'success', data: row });
}

export async function clearMyConversation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { id } = req.params;

  const deleted = await Conversation.findOneAndDelete({ _id: id, userId: user._id });
  if (!deleted) {
    throw new ApiError(404, 'Conversation not found');
  }

  await AnalysisResult.deleteMany({ conversationId: id, userId: user._id });

  return res.json({
    status: 'success',
    data: { conversation_id: id, cleared: true },
  });
}

export async function getMyConversationAssessment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    throw new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }

  const { user } = req.auth;
  const { id } = req.params;

  const conversation = await Conversation.findOne({ _id: id, userId: user._id }, { _id: 1, latestAnalysisId: 1 });
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const analysis = await AnalysisResult.findOne({
    userId: user._id,
    conversationId: id,
  }).sort({ createdAt: -1 });

  if (!analysis) {
    throw new ApiError(404, 'Assessment unavailable for this conversation');
  }

  return res.json({
    status: 'success',
    data: {
      conversation_id: String(conversation._id),
      sentiment: analysis.sentiment,
      emotion: analysis.emotion,
      risk: analysis.risk,
      llmMeta: analysis.llmMeta,
      analyzed_at: analysis.createdAt,
    },
  });
}

export async function getChatHealth(req, res) {
  const started = Date.now();

  let mlAvailable = false;
  let llmAvailable = false;

  try {
    const mlRes = await fetch(`${env.mlServiceUrl}/api/health`, { method: 'GET' });
    mlAvailable = mlRes.ok;
  } catch (_) {
    mlAvailable = false;
  }

  try {
    const llmRes = await fetch(`${env.llmServiceUrl}/health`, { method: 'GET' });
    llmAvailable = llmRes.ok;
  } catch (_) {
    llmAvailable = false;
  }

  const status = llmAvailable || mlAvailable ? 'healthy' : 'degraded';
  return res.json({
    success: true,
    status: 'success',
    data: {
      status,
      llm: { available: llmAvailable },
      ml: { available: mlAvailable },
      latencyMs: Date.now() - started,
      version: 'v1',
    },
    meta: { requestId: req.requestId, version: 'v1' },
  });
}
