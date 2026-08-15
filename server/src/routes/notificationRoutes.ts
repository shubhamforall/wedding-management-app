import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';

export const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get('/', asyncHandler(notificationController.list));
notificationRouter.patch('/:id/read', asyncHandler(notificationController.markRead));
notificationRouter.patch('/read-all', asyncHandler(notificationController.markAllRead));
