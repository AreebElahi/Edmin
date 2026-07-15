import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/prisma.js';
import { redisConnection } from './config/redis.js';
import { startOutboxPoller } from './workers/outboxPoller.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const requiredEnvVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'GOOGLE_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error(`FATAL ERROR: The following required environment variables are missing: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }

  try {
    // Warm up database connection pool before accepting requests
    console.log('Warming up database connection...');
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection warmed up successfully.');

    // Warm up Redis connection
    if (redisConnection && redisConnection.status !== 'ready') {
      console.log('Warming up Redis connection...');
      if (process.env.NODE_ENV !== 'production') {
        try {
          await Promise.race([
            redisConnection.ping(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
          ]);
          console.log('Redis connection warmed up successfully.');
        } catch (e) {
          console.log('Redis is not available locally, bypassing cache for this dev session.');
        }
      } else {
        // In production, we want a hard failure if Redis is unreachable 
        // to prevent cache stampedes and ensure health checks fail.
        await Promise.race([
          redisConnection.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('FATAL: Redis connection timeout during startup')), 5000))
        ]);
        console.log('Redis connection warmed up successfully.');
      }
    }

    app.listen(PORT as number, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      startOutboxPoller();
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
