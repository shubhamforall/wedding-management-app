import { Router } from 'express';
import * as weddingController from '../controllers/weddingController';
import * as memberController from '../controllers/memberController';
import * as invitationController from '../controllers/invitationController';
import * as budgetController from '../controllers/budgetController';
import * as dashboardController from '../controllers/dashboardController';
import * as announcementController from '../controllers/announcementController';
import * as listOptionController from '../controllers/listOptionController';
import * as documentController from '../controllers/documentController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';
import { requireWeddingMember, requireRole } from '../middleware/requireWeddingMember';
import { upload } from '../middleware/upload';

export const weddingRouter = Router();

weddingRouter.use(requireAuth);

weddingRouter.get('/', asyncHandler(weddingController.listMine));
weddingRouter.post('/', asyncHandler(weddingController.create));

weddingRouter.get('/:weddingId', requireWeddingMember, asyncHandler(weddingController.getOne));
weddingRouter.patch(
  '/:weddingId',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(weddingController.update)
);
weddingRouter.delete(
  '/:weddingId',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(weddingController.remove)
);

weddingRouter.get('/:weddingId/members', requireWeddingMember, asyncHandler(memberController.list));
weddingRouter.patch(
  '/:weddingId/members/:memberId',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(memberController.changeRole)
);
weddingRouter.delete(
  '/:weddingId/members/:memberId',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(memberController.remove)
);
weddingRouter.post(
  '/:weddingId/members/transfer-ownership',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(memberController.transferOwnership)
);

weddingRouter.get(
  '/:weddingId/invitations',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(invitationController.listForWedding)
);
weddingRouter.post(
  '/:weddingId/invitations',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(invitationController.create)
);
weddingRouter.post(
  '/:weddingId/invitations/:invitationId/resend',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(invitationController.resend)
);
weddingRouter.delete(
  '/:weddingId/invitations/:invitationId',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(invitationController.revoke)
);

weddingRouter.get('/:weddingId/dashboard', requireWeddingMember, asyncHandler(dashboardController.stats));

weddingRouter.get('/:weddingId/budget-summary', requireWeddingMember, asyncHandler(budgetController.summary));
weddingRouter.patch(
  '/:weddingId/budget-lines/:id',
  requireWeddingMember,
  requireRole('member'),
  asyncHandler(budgetController.updateLine)
);

weddingRouter.get('/:weddingId/announcement', requireWeddingMember, asyncHandler(announcementController.get));
weddingRouter.patch(
  '/:weddingId/announcement',
  requireWeddingMember,
  requireRole('member'),
  asyncHandler(announcementController.update)
);

weddingRouter.get('/:weddingId/list-options', requireWeddingMember, asyncHandler(listOptionController.list));
weddingRouter.post(
  '/:weddingId/list-options',
  requireWeddingMember,
  requireRole('member'),
  asyncHandler(listOptionController.create)
);
weddingRouter.patch(
  '/:weddingId/list-options/:id',
  requireWeddingMember,
  requireRole('member'),
  asyncHandler(listOptionController.update)
);
weddingRouter.delete(
  '/:weddingId/list-options/:id',
  requireWeddingMember,
  requireRole('owner'),
  asyncHandler(listOptionController.remove)
);

weddingRouter.get('/:weddingId/documents', requireWeddingMember, asyncHandler(documentController.list));
weddingRouter.post(
  '/:weddingId/documents',
  requireWeddingMember,
  requireRole('member'),
  upload.single('file'),
  asyncHandler(documentController.upload)
);
weddingRouter.get(
  '/:weddingId/documents/:id/download',
  requireWeddingMember,
  asyncHandler(documentController.download)
);
weddingRouter.patch(
  '/:weddingId/documents/:id',
  requireWeddingMember,
  requireRole('member'),
  asyncHandler(documentController.updateMeta)
);
weddingRouter.delete(
  '/:weddingId/documents/:id',
  requireWeddingMember,
  requireRole('member'),
  asyncHandler(documentController.remove)
);
