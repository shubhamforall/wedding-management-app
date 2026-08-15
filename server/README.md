# Backend — Wedding Management API

Node.js + Express + TypeScript + MySQL. See `../MIGRATION_ANALYSIS.md` for the full architecture.

## Local setup

```
npm install
cp .env.example .env   # fill in real values
npm run migrate        # applies server/migrations/*.sql
npm run dev
```

## Email (SMTP)

Invitation emails, email verification, and password reset all go through Nodemailer over SMTP — no third-party email API (Resend, SendGrid, etc.) is used.

### Setting up Gmail SMTP

Gmail requires an **App Password**, not your normal account password, for SMTP:

1. Enable **2-Step Verification** on the Google account you want to send from (Google Account → Security → 2-Step Verification). App Passwords aren't available without this.
2. Go to Google Account → Security → **App Passwords**.
3. Create one for "Mail" / "Other (Custom name)" — Google gives you a 16-character password.
4. Put it in `server/.env`:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=youraddress@gmail.com
   SMTP_PASSWORD=your16charapppassword
   EMAIL_FROM="Wedding Management <youraddress@gmail.com>"
   ```

   Remove spaces from the App Password when pasting it into `.env`.

5. **Never** commit `.env` — it's already gitignored. `.env.example` only holds placeholders and must stay that way.

### How it's wired

```
server/src/services/email/
  smtp.service.ts        — the Nodemailer transporter (createTransport, verify, sendMail)
  email.service.ts       — the ONLY thing the rest of the app imports (sendInvitationEmail,
                            sendVerificationEmail, sendPasswordResetEmail) — swapping SMTP for
                            another provider later only touches smtp.service.ts, nothing else
  templates/
    invitation.template.ts
    verification.template.ts
    passwordReset.template.ts
```

- On startup (`server.ts`), the SMTP connection is verified once. In development a failed/missing SMTP config only logs a warning — the rest of the app still runs. In production (`NODE_ENV=production`), a missing or failing SMTP config stops the server from starting.
- If SMTP isn't configured at all, `sendViaSmtp` returns `{ sent: false }` instead of throwing — invitation creation itself never fails because of email; the API response includes `emailSent: false` so the frontend can tell the user to share the invite link manually.
- The SMTP password is never logged, never returned in any API response, and never sent to the frontend — only `server/src/config/env.ts` reads `process.env.SMTP_PASSWORD`.

### Testing an invitation email locally

No public test endpoint is exposed (per security requirements). Test through the real flow:

1. `npm run dev` (backend) and the frontend dev server both running.
2. Log in, open a wedding, invite a member — first invite yourself (the `SMTP_USER` address) to confirm delivery end-to-end, then invite a second real address to confirm cross-recipient delivery.
3. Check the server console: `[smtp] Connected — sending as ...` at startup confirms the credentials work. `[smtp] Send failed: ...` on a specific attempt tells you what broke, without ever printing the password.
4. Click **Accept Invitation** in the received email — it should land on `/invite/:token` and, once logged in, join the wedding.

## Google sign-in

"Continue with Google" is a real OAuth flow, not a Supabase-managed redirect — the backend owns it end to end.

### Setting up Google OAuth credentials

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services** → **OAuth consent screen** → User type **External** → fill in app name + your email → add yourself as a test user while the app is in "Testing" mode (or publish it later to allow anyone).
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID** → Application type **Web application**.
4. Under **Authorized redirect URIs**, add exactly:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
5. Copy the **Client ID** and **Client Secret** into `server/.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   ```

### How it's wired

- `GET /api/auth/google` — redirects the browser to Google's consent screen (sets a short-lived `state` cookie for CSRF protection first).
- `GET /api/auth/google/callback` — Google redirects back here with a `code`; the backend exchanges it, verifies the identity token, finds-or-creates the user (email auto-verified since Google already confirmed it, no password set), issues the same session cookies as normal login, then redirects the browser to `${FRONTEND_URL}/auth/callback`, which the frontend already handles.
- If the flow fails at any point (denied, bad state, exchange error), the callback redirects to `${FRONTEND_URL}/auth/login?error=...` and the login page shows a toast — never a raw JSON error in the browser.
- `server/src/services/googleAuthService.ts` is the only place `GOOGLE_CLIENT_SECRET` is read; it's never sent to the frontend.
- If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are unset, "Continue with Google" fails with a clear "not configured" error instead of crashing anything else.
