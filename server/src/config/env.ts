import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',

  db: {
    host: required('DATABASE_HOST'),
    port: Number(process.env.DATABASE_PORT ?? 3306),
    database: required('DATABASE_NAME'),
    user: required('DATABASE_USER'),
    password: process.env.DATABASE_PASSWORD ?? '',
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
  },

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== 'false', // default true (port 465 implicit TLS)
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    fromEmail: process.env.EMAIL_FROM ?? 'Wedding Management <no-reply@example.com>',
  },

  // FRONTEND_URL is the canonical name going forward; APP_URL kept as a
  // fallback so existing local .env files (from before this SMTP migration)
  // don't need to change immediately.
  appUrl: process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  cookieSecure: process.env.COOKIE_SECURE === 'true',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${process.env.PORT ?? 3000}/api/auth/google/callback`,
  },
};
