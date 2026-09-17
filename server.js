import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import dotenv from 'dotenv';
import { startScheduler } from './workers/scheduler.js';

// Load env vars before anything else
dotenv.config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production' && !process.argv.includes('--production');
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Start the cron scheduler alongside the Next.js server
  await startScheduler();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}; shutting down.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}).catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
