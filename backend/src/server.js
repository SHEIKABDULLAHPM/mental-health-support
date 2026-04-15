import http from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { registerChatSocket } from './socket/chatSocket.js';

async function bootstrap() {
  await connectDb();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.allowedOrigins,
      credentials: true,
    },
  });

  registerChatSocket(io);
  app.set('io', io);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on :${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});
