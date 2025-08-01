import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import path from 'path';
import { inventoryRoutes } from './routes/inventory';

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
  prefix: '/', // This means files are served from the root URL
});

// API routes
fastify.register(inventoryRoutes, { prefix: '/api' });

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Catch-all route to serve index.html for SPA routing
fastify.setNotFoundHandler(async (request, reply) => {
  // If it's an API request, return 404
  if (request.url.startsWith('/api/')) {
    return reply.status(404).send({ success: false, error: 'Not found' });
  }
  
  // Otherwise, serve index.html for client-side routing
  return reply.sendFile('index.html');
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
    console.log(`Frontend available at http://localhost:${port}`);
    console.log(`API available at http://localhost:${port}/api`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();