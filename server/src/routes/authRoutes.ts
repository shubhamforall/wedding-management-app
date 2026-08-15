import { Router } from 'express';
import * as authController from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';
import { authRateLimit } from '../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, asyncHandler(authController.register));
authRouter.post('/login', authRateLimit, asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.post('/forgot-password', authRateLimit, asyncHandler(authController.forgotPassword));
authRouter.post('/reset-password', authRateLimit, asyncHandler(authController.resetPassword));
authRouter.post('/verify-email', asyncHandler(authController.verifyEmail));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));

authRouter.get('/google', authRateLimit, asyncHandler(authController.googleStart));
authRouter.get('/google/callback', asyncHandler(authController.googleCallback));
