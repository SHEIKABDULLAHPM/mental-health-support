import { verifyAccessToken } from '../utils/jwt.js';

export function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Unauthorized'));
      }
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub, role: payload.role };
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('chat:join', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('disconnect', () => {
      // no-op
    });
  });
}
