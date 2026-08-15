import { createApp } from './app';
import { env } from './config/env';
import { isSmtpConfigured, verifySmtpConnection } from './services/email/smtp.service';

async function start() {
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
