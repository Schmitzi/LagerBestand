import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import path from 'path';
import { equipmentRoutes } from './routes/equipment';
import { eventRoutes } from './routes/events';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

// Register CORS
fastify.register(cors, {
  origin: true
});

// Serve static files (frontend)
fastify.register(staticFiles, {
  root: path.join(__dirname, '../public'),
  prefix: '/',
});

// API routes
fastify.register(equipmentRoutes, { prefix: '/api' });
fastify.register(eventRoutes, { prefix: '/api'});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Catch-all route to serve index.html for SPA routing
fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/api/')) {
    return reply.status(404).send({ success: false, error: 'Not found' });
  }
  return reply.sendFile('index.html');
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Equipment Borrowing System running on port ${port}`);
    console.log(`Frontend: http://localhost:${port}`);
    console.log(`API: http://localhost:${port}/api`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();