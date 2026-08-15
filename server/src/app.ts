import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { pingDatabase } from './config/db';
import { authRouter } from './routes/authRoutes';
import { weddingRouter } from './routes/weddingRoutes';
import { invitationRouter } from './routes/invitationRoutes';
import { notificationRouter } from './routes/notificationRoutes';
import {
  guestsRouter,
  vendorsRouter,
  expensesRouter,
  shoppingItemsRouter,
  inventoryItemsRouter,
  tasksRouter,
  timelineEventsRouter,
  stayArrangementsRouter,
  emergencyContactsRouter,
  importantNumbersRouter,
  manualContactsRouter,
} from './routes/moduleRoutes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.appUrl,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', async (_req, res) => {
    try {
      await pingDatabase();
      res.json({ success: true, status: 'ok', db: 'connected' });
    } catch {
      res.status(503).json({ success: false, status: 'db-unreachable' });
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/weddings', weddingRouter);
  app.use('/api/invitations', invitationRouter);
  app.use('/api/notifications', notificationRouter);

  app.use('/api/weddings/:weddingId/guests', guestsRouter);
  app.use('/api/weddings/:weddingId/vendors', vendorsRouter);
  app.use('/api/weddings/:weddingId/expenses', expensesRouter);
  app.use('/api/weddings/:weddingId/shopping-items', shoppingItemsRouter);
  app.use('/api/weddings/:weddingId/inventory-items', inventoryItemsRouter);
  app.use('/api/weddings/:weddingId/tasks', tasksRouter);
  app.use('/api/weddings/:weddingId/timeline-events', timelineEventsRouter);
  app.use('/api/weddings/:weddingId/stay-arrangements', stayArrangementsRouter);
  app.use('/api/weddings/:weddingId/emergency-contacts', emergencyContactsRouter);
  app.use('/api/weddings/:weddingId/important-numbers', importantNumbersRouter);
  app.use('/api/weddings/:weddingId/contacts', manualContactsRouter);

  // Remaining feature routers (budget, dashboard, documents, settings,
  // notifications, search, announcement) get mounted here as they land.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
