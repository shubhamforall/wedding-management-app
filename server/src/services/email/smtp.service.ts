import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env';

let transporter: Transporter | null = null;
let configWarningLogged = false;

export function isSmtpConfigured(): boolean {
  return !!(env.smtp.host && env.smtp.user && env.smtp.password);
}

// Lazily created, cached — a single pooled transporter for the process
// lifetime rather than one per send. Never logs env.smtp.password, and
// never includes it in any thrown/returned error.
function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) {
    if (!configWarningLogged) {
      console.warn(
        '[smtp] Not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASSWORD) — emails will be logged, not sent.'
      );
      configWarningLogged = true;
    }
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.password },
    });
  }
  return transporter;
}

// Called once at startup (see server.ts). Confirms the SMTP account/host
// actually accept the given credentials before the app starts relying on
// them — same reasoning as pingDatabase() for MySQL. Never throws with the
// raw SMTP error (which can echo back connection strings) — logs a safe
// summary instead.
export async function verifySmtpConnection(): Promise<{ ok: boolean; configured: boolean }> {
  const client = getTransporter();
  if (!client) return { ok: false, configured: false };

  try {
    await client.verify();
    console.log(`[smtp] Connected — sending as ${env.smtp.user}`);
    return { ok: true, configured: true };
  } catch (err) {
    console.error(
      '[smtp] Connection verify failed:',
      err instanceof Error ? err.message : 'unknown error'
    );
    return { ok: false, configured: true };
  }
}

export interface RawEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendViaSmtp(input: RawEmailInput): Promise<{ sent: boolean; reason?: string }> {
  const client = getTransporter();
  if (!client) return { sent: false, reason: 'SMTP not configured' };

  try {
    await client.sendMail({
      from: env.smtp.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { sent: true };
  } catch (err) {
    // Log server-side for diagnosis; never let the raw SMTP error (which
    // can include auth details) reach the API response.
    console.error('[smtp] Send failed:', err instanceof Error ? err.message : 'unknown error');
    return { sent: false, reason: 'Email delivery failed' };
  }
}
