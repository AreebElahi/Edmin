import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbac.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginSchema, signupSchema, updateProfileSchema, changePasswordSchema } from '../validators/auth.validator.js';

import { signupHandler, changePasswordHandler } from '../modules/identity/identity.controller.js';

const router = express.Router();

router.post('/signup', authLimiter, validateRequest({ body: signupSchema, mode: 'warn' }), signupHandler);
router.post('/login', authLimiter, validateRequest({ body: loginSchema, mode: 'warn' }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/change-password', authenticate, validateRequest({ body: changePasswordSchema, mode: 'warn' }), changePasswordHandler);

// Enriched /me — returns full name, email, identifier, role, createdAt
router.get('/me', authenticate, authController.getMeHandler);
router.patch('/profile', authenticate, validateRequest({ body: updateProfileSchema, mode: 'warn' }), authController.updateProfileHandler);
router.patch('/avatar', authenticate, authController.updateAvatarHandler);
router.get('/avatar', authenticate, authController.getAvatarHandler);

router.get('/me/permissions', authenticate, authController.getPermissionsHandler);



export default router;

