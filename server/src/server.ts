import { createApp } from './app';
import { env } from './config/env';
import { runMigrations } from './config/migrate';
import { isSmtpConfigured, verifySmtpConnection } from './services/email/smtp.service';

async function start() {
  // Run any pending migrations before accepting traffic — Hostinger's
  // deploy flow has no separate migration hook (see migrate.ts), so this
  // is what keeps the schema in sync automatically on every deploy instead
  // of requiring a manual SSH step each time. If this fails, the app must
  // not start against a schema it can't trust.
  try {
    await runMigrations();
  } catch (err) {
    console.error('[startup] Migrations failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // Email is required in production (invitations/password-reset depend on
  // it), but a missing/broken SMTP setup shouldn't block local dev from
  // running everything else — see MIGRATION_ANALYSIS.md / SMTP setup docs.
  if (env.isProduction) {
    if (!isSmtpConfigured()) {
      console.error('[startup] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD required in production).');
      process.exit(1);
    }
    const { ok } = await verifySmtpConnection();
    if (!ok) {
      console.error('[startup] SMTP connection could not be verified.');
      process.exit(1);
    }
  } else {
    await verifySmtpConnection();
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

start();
