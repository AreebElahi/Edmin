import { Router } from 'express';
import prisma from '../../config/prisma.js';
import { redisConnection } from '../../config/queue.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check Postgres
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis
    let redisStatus = 'disconnected';
    if (redisConnection && redisConnection.status === 'ready') {
      redisStatus = 'connected';
    }

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus
      }
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
