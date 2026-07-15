import { Router } from 'express';
import { getConfigPublicHandler } from '../controllers/admin/settings.controller.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Retrieve settings config for all authenticated users
router.get('/', authenticate, getConfigPublicHandler);

export default router;
