# Migration Analysis: Supabase → Node.js + Express + MySQL + JWT

Phase 1 deliverable per `Supabase to Node.js + MySQL Migration Prompt.md` section 41. Analysis only — no application code has been written yet. Read `HANDOFF.md` alongside this for full product/business context.

---

## A. Current Architecture Analysis

The app is a client-heavy React SPA where **Supabase is the entire backend**: there is no custom server today. Every `src/features/*/api.ts` file calls `supabase-js` directly against PostgREST (auto-generated REST over Postgres), Supabase Auth, Supabase Storage, or a single Deno Edge Function.

- **Data access**: PostgREST via `supabase.from(table)...`. No hand-written SQL in the app; all authorization is enforced by Postgres Row Level Security (RLS) policies, not application code. The client is not typed against a generated `Database` type (deliberately — see `HANDOFF.md`), so query shapes are pinned ad hoc via `.returns<T>()` per call.
- **Auth**: Supabase Auth (GoTrue) — email/password + Google OAuth (wired but provider never configured), session persisted client-side (`persistSession:true`, `autoRefreshToken:true`) via its own localStorage mechanism, not our code.
- **Authorization**: 100% RLS. A single SECURITY DEFINER helper, `is_wedding_member(wedding_id, min_role)`, is referenced by nearly every policy. There is no separate "check role" code path anywhere in the frontend — the database rejects unauthorized reads/writes outright.
- **Storage**: one private bucket (`documents`), RLS on `storage.objects` scoped by treating the first path segment as `wedding_id`.
- **Email**: one Deno Edge Function (`send-invitation-email`) called via `supabase.functions.invoke`, itself calling Resend's HTTP API directly. Uses a `SUPABASE_SERVICE_ROLE_KEY` admin client to read data the invitee's own RLS wouldn't yet allow.
- **Business logic in the database, not the app**: default data seeding (list options, budget categories, timeline events) via `AFTER INSERT` triggers; dashboard/budget aggregation via SQL views (`dashboard_stats`, `budget_summary`) rather than application code; last-owner-removal protection via a trigger; cross-user notifications via triggers on `wedding_members`.

**The single biggest migration risk is exactly this last point**: a large amount of "backend logic" currently lives as Postgres triggers, views, and RLS policies with zero equivalent in the TypeScript codebase. None of that is optional — it has to be re-implemented as real application code (services/middleware) in the new backend, not just "the schema."

---

## B. Migration Mapping

```
Supabase PostgreSQL         → MySQL 8
Supabase Auth                → Node.js: bcrypt + JWT (access token) + our own users table
Supabase RLS                 → Express authorization middleware (requireAuth, requireWeddingMember, requireRole)
Supabase Storage              → Filesystem storage on Hostinger (multer + served/streamed via Express, path validated per-tenant)
Supabase Edge Function          → Node.js service (invitationEmailService) + Resend SDK, called in-process (not a separate function)
Supabase JS (client)          → src/lib/api.ts (thin fetch/axios wrapper) + per-feature api.ts calling REST endpoints
RLS-driven cross-user notifications → Express-side "after successful mutation, insert notification row" calls in the relevant service (membership service, not a DB trigger)
Postgres views (dashboard_stats, budget_summary) → SQL aggregation queries (or app-level computation) in dashboardService/budgetService
Postgres triggers (seeding, last-owner guard) → Explicit steps in weddingService.createWedding() / membersService.removeMember() etc.
```

---

## C. MySQL Schema

Direct table-by-table mapping from the 12 Supabase migrations. UUIDs are kept as the identifier strategy (stored as `CHAR(36)`, generated app-side with `crypto.randomUUID()` or `uuid` npm package) — switching to auto-increment ints would touch every FK across 20 tables and every frontend type for no real benefit, so it's the lower-risk choice given "preserve existing behavior."

**Conventions used below**: `id CHAR(36) PRIMARY KEY`, `created_at`/`updated_at` as `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` (`updated_at` also `ON UPDATE CURRENT_TIMESTAMP`), enums as MySQL `ENUM(...)` (Postgres enum types don't exist in MySQL — this is a real conversion, not 1:1), booleans as `TINYINT(1)`, money as `DECIMAL(12,2)`, `citext` (case-insensitive email) → `VARCHAR(255)` with a `COLLATE utf8mb4_general_ci` column collation (MySQL has no citext type — this is a real behavior change to note under Risks).

### Core tenancy (from 0001)

```sql
users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE COLLATE utf8mb4_general_ci,
  password_hash VARCHAR(255) NULL,        -- NULL for pre-migration Supabase accounts, see Section H
  full_name VARCHAR(255),
  avatar_url VARCHAR(1024),
  phone VARCHAR(50),
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
-- Replaces auth.users + user_profiles combined (Supabase split these; we don't need to).

weddings (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bride_name VARCHAR(255) NOT NULL,
  groom_name VARCHAR(255) NOT NULL,
  wedding_date DATE NULL,
  reception_date DATE NULL,
  venue VARCHAR(255),
  address TEXT,
  wedding_side ENUM('groom','bride','both') NOT NULL,
  owner_id CHAR(36) NOT NULL,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
)

wedding_members (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner','member','viewer') NOT NULL,
  status ENUM('active','removed') NOT NULL DEFAULT 'active',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wedding_user (wedding_id, user_id),
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_wedding_members_wedding (wedding_id)
)

wedding_invitations (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  wedding_name VARCHAR(255),              -- denormalized, migration 0012
  email VARCHAR(255) NOT NULL COLLATE utf8mb4_general_ci,
  role ENUM('owner','member','viewer') NOT NULL,
  token CHAR(36) NOT NULL UNIQUE,
  status ENUM('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
  invited_by CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id),
  UNIQUE KEY uq_pending_invite (wedding_id, email, status)  -- MySQL allows this since status is part of the key;
                                                              -- Postgres used a partial unique index (status='pending' only),
                                                              -- MySQL has no partial indexes — enforce "no duplicate PENDING
                                                              -- invite" in application code instead (see Risks).
)

list_options (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  list_type VARCHAR(50) NOT NULL,   -- 16 known values, kept as VARCHAR not ENUM since Settings UI can theoretically add types
  value VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_list_options_wedding_type (wedding_id, list_type)
)
```

### Operational tables (from 0003)

```sql
wedding_announcements (
  wedding_id CHAR(36) PRIMARY KEY,
  message TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
)

budget_lines (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  category VARCHAR(100) NOT NULL,
  estimated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_budget_wedding_category (wedding_id, category),
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
)

vendors (
  id CHAR(36) PRIMARY KEY, wedding_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL, category VARCHAR(100),
  phone VARCHAR(50), alternate_phone VARCHAR(50), email VARCHAR(255),
  total_amount DECIMAL(12,2) DEFAULT 0, advance_paid DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50), notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_vendors_wedding (wedding_id)
)

expenses (
  id CHAR(36) PRIMARY KEY, wedding_id CHAR(36) NOT NULL,
  category VARCHAR(100) NOT NULL, vendor_id CHAR(36) NULL,
  amount DECIMAL(12,2) NOT NULL, payment_mode VARCHAR(50),
  expense_date DATE, notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
  INDEX idx_expenses_wedding_category (wedding_id, category)
)

guests (
  id CHAR(36) PRIMARY KEY, wedding_id CHAR(36) NOT NULL,
  family_name VARCHAR(255) NOT NULL, side VARCHAR(20),
  contact_number VARCHAR(50), invitation_status VARCHAR(20),
  attending_engagement TINYINT(1) DEFAULT 0,
  attending_haldi TINYINT(1) DEFAULT 0,
  attending_wedding TINYINT(1) DEFAULT 0,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_guests_wedding (wedding_id)
)

shopping_items ( id, wedding_id, item_name, category, status, notes, created_at — FK+index same pattern )
inventory_items ( id, wedding_id, item_name, required_qty, available_qty, status, notes, created_at — FK+index same pattern )

stay_arrangements (
  id CHAR(36) PRIMARY KEY, wedding_id CHAR(36) NOT NULL, guest_id CHAR(36) NULL,
  hotel_villa_name VARCHAR(255), address TEXT, responsible_person VARCHAR(255), notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL
)

tasks (
  id CHAR(36) PRIMARY KEY, wedding_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL, category VARCHAR(100), priority VARCHAR(20),
  status VARCHAR(20), due_date DATE, notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_tasks_wedding_due (wedding_id, due_date)
)

timeline_events ( id, wedding_id, event_name, event_date, status, notes, created_at — FK+index same pattern )

contacts (
  id CHAR(36) PRIMARY KEY, wedding_id CHAR(36) NOT NULL,
  source ENUM('manual','auto_family','auto_vendor') NOT NULL DEFAULT 'manual',
  name VARCHAR(255) NOT NULL, phone VARCHAR(50), notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
)

documents (
  id CHAR(36) PRIMARY KEY, wedding_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL, storage_path VARCHAR(1024) NOT NULL,
  category VARCHAR(100), uploaded_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
)
```

### Later additions (0008, 0010, 0012 — already folded into tables above where applicable)

```sql
emergency_contacts ( id, wedding_id, name, relation, phone, created_at — FK cascade, member+ RLS pattern )
important_numbers  ( id, wedding_id, label, phone, created_at — FK cascade, member+ RLS pattern )

notifications (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, wedding_id CHAR(36) NOT NULL,
  type ENUM('success','warning','error','info') NOT NULL,
  message VARCHAR(500) NOT NULL, link VARCHAR(1024), is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_created (user_id, created_at DESC)
)
```

### Views → application queries

`dashboard_stats` and `budget_summary` are Postgres views with `security_invoker`. MySQL views can't easily replicate the RLS-dependent security model, and the query complexity (multiple correlated subqueries) is exactly the kind of thing better expressed as a parameterized query in `dashboardService.ts` / `budgetService.ts` than a MySQL view — **recommend converting both to plain SQL functions in the repository layer**, run with the caller's `weddingId` already validated by middleware, not database views.

### Auth-only tables (new, no Supabase equivalent)

```sql
password_reset_tokens ( id, user_id, token_hash, expires_at, used_at, created_at )
email_verification_tokens ( id, user_id, token_hash, expires_at, created_at )
```

---

## D. REST API Specification

```
Auth
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
GET    /api/auth/me

Weddings
GET    /api/weddings                      (my weddings, with role)
POST   /api/weddings
GET    /api/weddings/:weddingId
PATCH  /api/weddings/:weddingId
DELETE /api/weddings/:weddingId           (owner only)

Members
GET    /api/weddings/:weddingId/members
PATCH  /api/weddings/:weddingId/members/:memberId       (role change, owner only)
DELETE /api/weddings/:weddingId/members/:memberId       (owner only, last-owner-protected)
POST   /api/weddings/:weddingId/members/transfer-ownership

Invitations
GET    /api/weddings/:weddingId/invitations             (pending, owner only)
POST   /api/weddings/:weddingId/invitations              (owner only)
POST   /api/weddings/:weddingId/invitations/:id/resend
DELETE /api/weddings/:weddingId/invitations/:id          (revoke, owner only)
GET    /api/invitations/my-pending                       (current user, by email)
POST   /api/invitations/:token/accept

Per-module CRUD (guests, budget-lines, expenses, vendors, shopping-items,
inventory-items, tasks, timeline-events, stay-arrangements,
emergency-contacts, important-numbers, contacts) — identical shape ×12:
GET    /api/weddings/:weddingId/<module>
POST   /api/weddings/:weddingId/<module>
PATCH  /api/weddings/:weddingId/<module>/:id
DELETE /api/weddings/:weddingId/<module>/:id

Dashboard / Budget
GET    /api/weddings/:weddingId/dashboard
GET    /api/weddings/:weddingId/budget-summary
GET    /api/weddings/:weddingId/announcement
PATCH  /api/weddings/:weddingId/announcement

Documents
GET    /api/weddings/:weddingId/documents
POST   /api/weddings/:weddingId/documents          (multipart, multer)
GET    /api/documents/:id/download                 (streams file, checks tenant)
DELETE /api/documents/:id

Settings / List Options
GET    /api/weddings/:weddingId/list-options?listType=
POST   /api/weddings/:weddingId/list-options
PATCH  /api/weddings/:weddingId/list-options/:id
DELETE /api/weddings/:weddingId/list-options/:id

Notifications
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all

Search
GET    /api/weddings/:weddingId/search?q=
```

---

## E. Authentication Architecture

- **Register**: validate email format + password strength (zod) → check email uniqueness → `bcrypt.hash(password, 12)` → insert `users` row (`email_verified=0`) → create email verification token → send verification email via Resend → return user (no session yet, matching current Supabase behavior where email confirmation may be required before login — confirm with product owner whether email verification should be mandatory before login, since the current Supabase project's confirmation setting isn't visible from the frontend code alone).
- **Login**: find user by email → `bcrypt.compare` → issue a JWT access token (short-lived, e.g. 1h) containing only `{sub: userId}` — no email/role/wedding claims, since role is always wedding-scoped and must be re-checked per request, not trusted from an old token. Also issue a longer-lived **refresh token** (random, stored hashed in a `refresh_tokens` table, rotated on use) so sessions survive longer than 1h without re-login, mirroring Supabase's `autoRefreshToken` behavior. Section 11 of the migration prompt prefers HttpOnly cookies — recommended here too (see trade-off note below).
- **Token storage trade-off**: current frontend calls `supabase.from(...)` directly with the SDK managing tokens invisibly. Moving to HttpOnly cookies means the frontend API client (`src/lib/api.ts`) needs `credentials:'include'` on every fetch and the backend needs CORS configured with a specific origin + `credentials:true` (no wildcard). This is a real frontend change (new API client) but not a UI change — acceptable. Recommend HttpOnly + Secure + SameSite=Lax cookies over localStorage JWT, since XSS-stolen localStorage tokens are a strictly worse failure mode for an app handling invitation tokens and personal guest data.
- **requireAuth middleware**: reads JWT from cookie, verifies signature/expiry, loads `req.user = {id}`, 401 on failure.
- **Password reset**: `forgot-password` always returns success regardless of whether the email exists (no enumeration); generates a random token, stores its hash + expiry in `password_reset_tokens`, emails the raw token as a link. `reset-password` validates token hash + expiry + not-yet-used, updates `password_hash`, marks token used.
- **Email verification**: same token-hash-table pattern, separate table so reset and verification tokens don't share expiry/reuse semantics.
- **Google OAuth**: current wiring calls `supabase.auth.signInWithOAuth`, which Supabase handled entirely (redirect, token exchange, session creation) — none of that exists once Supabase Auth is gone. Reimplementing this requires: registering our own Google OAuth client (Google Cloud Console), a `/api/auth/google` redirect endpoint, `/api/auth/google/callback` exchanging the code server-side, then creating/finding the local `users` row by Google email and issuing our own JWT/cookie exactly like password login. This is a non-trivial standalone piece of work — **flagging per section 14 of the prompt rather than doing it silently**: recommend doing it as its own phase after core auth/CRUD is working, since Google was never actually configured in the current live app either (so nothing regresses by sequencing it last).

---

## F. Multi-tenancy Architecture

RLS's job moves entirely into Express middleware, run in this order on every wedding-scoped route:

```
requireAuth                    → req.user = {id}
requireWeddingMember(weddingId) → looks up wedding_members WHERE wedding_id=? AND user_id=req.user.id AND status='active'
                                    404 (not 403 — don't leak wedding existence) if no row
                                    attaches req.membership = {role}
requireRole('member')          → 403 if req.membership.role is 'viewer' and route needs write access
requireRole('owner')           → 403 for owner-only routes (delete wedding, manage members, invitations)
```

Every repository function for wedding-scoped tables takes `weddingId` as a mandatory first argument and includes it in the `WHERE` clause — there is no equivalent of "the database rejects it for you" anymore, so **every single query in every repository must be reviewed to confirm it filters by `wedding_id`**, since a missed filter is now a real cross-tenant data leak rather than an RLS-caught error. This is the #1 thing to get right in code review during Phase 4/6.

`is_wedding_member(wedding_id, min_role)`'s three-tier check (viewer/member/owner) maps directly to `requireRole(minRole)` comparing `req.membership.role` against an ordinal (`viewer:0, member:1, owner:2`).

---

## G. File Storage Architecture

Replace Supabase Storage with local filesystem storage under Hostinger, structured identically to the existing bucket path scheme for a clean 1:1 mapping:

```
UPLOAD_DIR/
  <wedding_id>/
    <uuid>-<original_filename>
```

- Upload: `multer` with `diskStorage`, destination resolved to `path.join(UPLOAD_DIR, weddingId)` (created if missing), filename `${crypto.randomUUID()}-${sanitizeFilename(originalname)}`. File size limit + allowed MIME types enforced (current app doesn't restrict this via Supabase either, but MySQL migration is the right time to add it, since Hostinger disk is finite unlike Supabase Storage).
- Download: `GET /api/documents/:id/download` — looks up the document row, `requireWeddingMember` checks tenant access, then streams the file (`res.sendFile` or a read stream) rather than issuing a redirect — replaces Supabase's `createSignedUrl` (which off-loaded auth-checked delivery to Supabase's CDN; we don't have that, so every download request re-validates membership server-side instead).
- Delete: remove DB row + `fs.unlink` the file; same order as current rollback logic (storage first, then DB, or vice versa — recommend DB row deleted only after file deletion confirms, matching the existing upload's "roll back storage on DB failure" carefulness in reverse).
- **Path traversal**: `storage_path` is never accepted from the client for read/delete — always looked up server-side from the `documents` row by `id`, never constructed from client-supplied strings. `sanitizeFilename` strips `../`, null bytes, and non-filename characters before use in the *upload* filename only.
- **Hostinger-specific risk**: shared hosting plans may reset the filesystem on redeploy or not persist an arbitrary `UPLOAD_DIR` outside the app directory — needs confirming against the specific Hostinger Business plan's persistent storage guarantees before committing to this design; flagged under Risks below.

---

## H. Migration/Data Strategy

1. Build the MySQL schema and the new backend against a **copy** of the live Supabase project — never touch the production Supabase project directly during development.
2. Data export: `pg_dump --data-only` per table (or `supabase db dump`), or simpler given the modest data volume this app actually has (per `HANDOFF.md`, per-wedding datasets are small by design) — a one-off Node script using `pg` to read every table and `mysql2` to insert, run once, with FK-order-aware insertion (users → weddings → wedding_members → everything else) and UUIDs preserved as-is (no re-keying needed, which is the main benefit of having kept UUIDs in Section C).
3. **Auth users specifically require the password-migration strategy in Section 32** (see next section) — they cannot be exported/transformed like normal data since Supabase Auth never exposes password hashes (and its hash format wouldn't be bcrypt-compatible even if it did).
4. Storage: download every object from the `documents` bucket via the Supabase Storage API, write to `UPLOAD_DIR/<wedding_id>/<same-filename>`, and copy `storage_path` unchanged into the new `documents.storage_path` column, so the app-level path convention doesn't need to change.
5. Verification: row counts per table (Supabase vs MySQL) must match exactly; spot-check FK integrity (every `wedding_id` in every child table resolves to an existing `weddings` row); do NOT decommission the Supabase project until the new stack has been used in production for a burn-in period the user is comfortable with.

---

## I. Risks

- **Password migration (blocking, see Section 32 of the prompt)**: Supabase Auth passwords cannot be reused. Recommended approach: import users with `password_hash = NULL`, force a password-reset flow on first login attempt against the new backend (detect `NULL` hash → send reset-password email automatically instead of a "wrong password" error). This is a real, user-visible one-time inconvenience for every existing account and must be communicated, not silently handled.
- **RLS → middleware is not a mechanical translation.** RLS is enforced at the database layer no matter what query runs; Express middleware is only enforced if every route remembers to use it and every repository function remembers to filter by `wedding_id`. This is the single largest correctness risk in the whole migration — a missed check is a silent cross-tenant leak, not a loud error. Recommend an integration test suite (Section 35's multi-tenancy tests) as a hard gate before Phase 10, not an afterthought.
- **Triggers and views have no code today.** `guard_last_owner`, `handle_new_wedding` (owner auto-membership), `seed_default_list_options`, `seed_default_budget_lines`, `seed_default_timeline_events`, `notify_wedding_owners_new_member`, `notify_member_role_change`, `dashboard_stats`, `budget_summary` — none of this logic exists in TypeScript anywhere yet. All nine of these need genuinely new code, not a lift-and-shift. Underestimating this is the most likely way the migration timeline slips.
- **MySQL has no partial unique indexes.** The Postgres "only one *pending* invite per wedding+email" constraint (`wedding_invitations`) must be enforced in `invitationService.create()` with a `SELECT ... FOR UPDATE` + check before insert, not a DB constraint — a small race-condition window opens under concurrent invite requests that didn't exist before (low real-world likelihood for this app's usage pattern, but worth documenting).
- **citext (case-insensitive email) has no MySQL equivalent.** Using a `_ci` collation is the closest analog but behaves subtly differently for some Unicode edge cases. Low risk for this app (ASCII emails), documenting rather than blocking on it.
- **Google OAuth is a bigger lift than it looks** — Supabase handled the entire OAuth dance; reimplementing it is a standalone auth-provider integration, not a config toggle. Recommend sequencing it after core migration is stable (Section 14 already asks to flag rather than silently drop it — this is that flag).
- **Hostinger filesystem persistence for uploaded documents** needs confirming against the actual hosting plan before the storage design in Section G is finalized — shared hosting sometimes doesn't guarantee a persistent writable directory across deploys.
- **`WeddingInvitation` type doesn't currently include `wedding_name`** even though migration 0012 added the column and the frontend already reads it via a separate `MyPendingInvitation` interface in `weddings/api.ts` — small existing type-drift to clean up during the frontend API-layer rewrite (Section 25/26), not a migration blocker, just worth fixing while those files are being touched anyway.
- **Dashboard/budget views were deliberately "always computed, never stored"** (per `HANDOFF.md`'s note on `budget_summary`) — reproducing them as parameterized queries instead of MySQL views preserves that property; reproducing them as *stored/cached* values would silently change existing behavior and must be avoided.

---

## J. Implementation Plan

Following the prompt's own phase structure (Section 38) exactly, since it's well-sequenced and each phase has a natural stop-and-test point:

1. **Phase 1 — Analysis** *(this document)*. Stop here for approval before any code.
2. **Phase 2 — Backend foundation**: `server/` skeleton, Express + TypeScript, MySQL connection pool (`mysql2/promise`), migration runner, centralized error handler, security middleware (helmet/cors/rate-limit), zod validation setup.
3. **Phase 3 — Authentication**: register/login/logout/JWT/bcrypt/refresh tokens/password reset/email verification, tested standalone with no wedding-scoped routes yet.
4. **Phase 4 — Multi-tenancy**: weddings CRUD, wedding_members, `requireWeddingMember`/`requireRole` middleware, last-owner-protection logic, owner-auto-membership-on-create logic. This is where the RLS-replacement risk from Section I gets addressed head-on — test cross-tenant isolation explicitly before moving on.
5. **Phase 5 — Invitations**: creation, token validation, accept flow, resend, revoke, Resend email integration (ported from the Edge Function).
6. **Phase 6 — Application modules**: the 12 identical-shape CRUD modules, then dashboard/budget (as queries, not views), then documents (filesystem storage), then settings/list-options, notifications (with explicit insert-on-mutation replacing the DB triggers), search.
7. **Phase 7 — Frontend migration**: new `src/lib/api.ts` client, rewrite each `src/features/*/api.ts` to call REST endpoints instead of `supabase-js`, keep every hook/component/UI untouched per Section 4.
8. **Phase 8 — Data migration**: export/transform/import per Section H, including the password-reset-required flag for existing users.
9. **Phase 9 — Security & testing**: full run of Section 35's test list, with particular weight on multi-tenancy and the specific risks flagged in Section I.
10. **Phase 10 — Hostinger deployment**: production env vars, build, domain/SSL/CORS, GitHub-based deploy.

**Stopping here per Section 41 — waiting for approval before Phase 2 begins.**
