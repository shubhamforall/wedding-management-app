import { Router } from 'express';
import * as invitationController from '../controllers/invitationController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';

export const invitationRouter = Router();

invitationRouter.get('/my-pending', requireAuth, asyncHandler(invitationController.listMine));
invitationRouter.post('/:token/accept', requireAuth, asyncHandler(invitationController.accept));
