# Wedding Management App — Handoff

Written for whoever (human or AI) picks this up next. Read this before touching code.

## What this is

A production-track multi-tenant SaaS wedding-planning app, replacing an Excel workbook (`Wedding_Management_Workbook.xlsx`, still in repo root). Built incrementally over 10 phases, all now complete.

**Update**: a real Supabase project now exists and all 11 migrations (0001-0011) are applied — see "Live project" below. Signup/login/wedding-creation have been tested end-to-end for real. Everything past wedding-creation (guests, expenses, vendors, tasks, dashboard numbers, invite flow, second account) is still untested against real data as of this writing — pick up there.

### Live project

- Supabase project ref: `xniwyxobsfvifwdfrpwq`, region `ap-south-1` (Mumbai)
- `.env` in repo root is filled in with real `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` — **do not commit this**, it's gitignored, but be aware it now holds live (if low-risk, anon-only) credentials
- To run migrations against it again in future: `SUPABASE_ACCESS_TOKEN=<token> npx supabase db push --password '<db password>' --yes` (token from Supabase dashboard → Account → Access Tokens; db password was set at project creation)
- **A local DNS quirk on this dev machine**: the default resolver (via the router) fails to resolve `*.supabase.co` — `curl`/`nslookup` need `--resolve host:443:<ip>` or an explicit DNS server (`nslookup host 1.1.1.1`) to work from this shell. The browser is unaffected (uses its own/secure DNS). Not a project issue, just this machine's network — if migrations/tests weirdly fail with `Could not resolve host`, this is why.

### Bug found and fixed during first real test

`0011_fix_weddings_select_policy.sql` — the original `weddings` SELECT RLS policy (`is_wedding_member(id, 'viewer')` only) failed for the wedding creator immediately after `INSERT ... RETURNING` (i.e. any `.insert(...).select().single()` call), because that policy depends on a `wedding_members` row an `AFTER INSERT` trigger creates, and Postgres evaluates the RETURNING clause's SELECT-policy check before that trigger's effect is visible to it. Confirmed via curl: `return=minimal` (no RETURNING) → 201 success; `return=representation` (RETURNING) → 403 `new row violates row-level security policy`. Fixed by adding `owner_id = auth.uid() OR ...` to the policy. **If you see this exact error pattern on any other table with a similar "creator-gets-auto-membership-via-trigger" shape, check for the same class of bug** — nothing else was audited for it yet, this was found and fixed reactively on `weddings` only.

## Source of truth hierarchy

1. **`Wedding_Management_Workbook.xlsx`** — the actual spreadsheet, read directly via openpyxl early in this project. This is the real spec.
2. `Wedding_Management_Workbook_Architecture_v2.md` — a richer aspirational doc, explicitly **overridden** wherever it conflicts with the workbook (see "Scope decisions" below).
3. The original user prompt — described an even richer feature set (Transport with vehicles/drivers, Vendor Maps/UPI/bank details, Decision Log, etc.).

**Resolution**: user was asked explicitly (AskUserQuestion) which to follow where these three disagreed. Answer: **strict workbook-only** on every point. This is recorded in project memory (`project_wedding_app_scope.md`) and must not be silently "improved" back toward the richer versions without asking again.

### Concrete scope deltas (workbook has LESS than the richer docs)

- **Guests**: only `invitation_status` (Yes/No) + 3 fixed attendance checkboxes (Engagement/Haldi/Wedding). No Call Status, Confirmation Status, Assigned To, Accommodation/Vehicle/Gift flags — even though the workbook's own Settings sheet defines unused `List_CallStatus`/`List_ConfirmationStatus` (dead config, deliberately not wired).
- **No Decision Log** module at all.
- **Stay Arrangement** (the workbook's actual name — "Transport" in the original prompt): only Hotel/Villa, Address, Responsible Person, Notes. No Vehicle/Driver/Pickup/Drop.
- **Vendors**: no Google Maps link, UPI ID, Bank Details, Due Date, Contract link.
- **Shopping**: no Estimated Cost, Store, Bill Link.
- **Inventory**: no Category/Unit columns, no Shortfall *stored* (computed client-side instead).

If a future task says "add X field to module Y" and X was one of the dropped fields above — that's a deliberate scope expansion the user is choosing now, not a bug fix. Fine to build, just don't assume it was an oversight.

### One deviation I made without a fresh ask (flagged at the time)

**Wedding Info** (bride/groom names editable post-creation, address, Emergency Contacts, Important Phone Numbers) was never assigned its own phase in the user's 10-phase roadmap, but **Contacts** (Phase 9) needs it to auto-sync from. I built it during Phase 9 as a prerequisite. It's real, tested-by-build, and wired in — just noting it wasn't explicitly requested before being built.

## Tech stack (as actually installed, not aspirational)

- React 19.2 + TypeScript + Vite 8 (rolldown-vite, not the classic esbuild Vite)
- Tailwind CSS v4 (CSS-first config via `@theme` in `src/index.css`, no `tailwind.config.js`)
- React Router v7 (`createBrowserRouter`, data-router `lazy` route API used for code-splitting)
- TanStack Query v5 (all server state) + TanStack Table v8 (`DataTable` wrapper)
- React Hook Form (every form)
- Supabase JS v2 client — **NOT parameterized with a `Database` generic**. Reason documented in `src/lib/supabase.ts`: postgrest-js's newer type parser expects the exact shape `supabase gen types` emits (`Relationships: []` arrays per table, etc.), and a hand-rolled type collapses everything to `never`. Query result shapes are pinned per-call with `.returns<T>()`. **Once a real Supabase project exists, run `supabase gen types typescript` and switch back to `createClient<Database>(...)`** — this will make a lot of code safer and is the single highest-value typing improvement available.
- Recharts (Budget page bar chart only, so far)
- react-hot-toast, dayjs, lucide-react
- Vitest + React Testing Library (unit/component tests only, no integration or e2e)

## Folder structure

```
src/
  app/            router.tsx, AppProviders.tsx (QueryClient/Theme/Auth), navigation.ts (nav config)
  components/
    layout/       AppShell, Sidebar (desktop), BottomNav (mobile), MorePage, NotFoundPage, RouteErrorBoundary
    ui/           all reusable primitives — Button, Input, Select, Textarea, Checkbox, Dialog, ConfirmDialog,
                   Card, Badge, Avatar, DataTable, StatCard, Meter, Skeleton, Spinner, EmptyState, ComingSoon, ThemeToggle
  features/       one dir per module, each with types.ts, api.ts (raw supabase calls), hooks.ts (TanStack Query wrappers),
                   *Page.tsx, *FormDialog.tsx as needed. Modules: auth, weddings, members, dashboard, guests, budget,
                   expenses, vendors, shopping, inventory, tasks, timeline, weddingInfo, stay, contacts, documents,
                   search, notifications
  hooks/          useTheme.tsx, useListOptions.ts (the dropdown-source hook — see below)
  lib/            supabase.ts (client), cn.ts (clsx wrapper), format.ts (₹ currency + number formatting), theme.css
  types/          database.ts — hand-written interfaces (Wedding, WeddingMember, ListOption, etc.), NOT the postgrest
                   Database generic (see above)
supabase/
  migrations/     0001 through 0010, sequential, see below
  functions/
    send-invitation-email/   Deno edge function, Resend-based. DEPLOYED and LIVE on the real project as of this
                              writing — RESEND_API_KEY and APP_URL secrets are both set, delivery confirmed working
                              (real email received). Sender is Resend's sandbox address (onboarding@resend.dev),
                              which can only deliver to the email the Resend account was signed up with — inviting
                              arbitrary real people needs a verified domain in Resend (not done yet, needs a domain
                              the user owns). APP_URL is currently http://localhost:5173 (vite.config.ts now pins
                              the dev server to that port via server.port/strictPort) — MUST be updated to the real
                              Vercel URL via `supabase secrets set APP_URL=...` once deployed, or invite links will
                              point at localhost.
```

## Database — every migration, in order

1. **`0001_core_tenancy.sql`**: `user_profiles` (auto-created via `on_auth_user_created` trigger on `auth.users` insert), `weddings`, `wedding_members` (role: owner/member/viewer), `wedding_invitations`, `list_options` (the single source for every dropdown across the app — mirrors the workbook's Settings sheet). Triggers: owner auto-membership on wedding creation, last-owner-removal guard, default `list_options` seeding (21 lists, values copied literally from the workbook's Settings sheet).
2. **`0002_rls_policies.sql`**: `is_wedding_member(wedding_id, min_role)` SECURITY DEFINER helper (avoids RLS recursion), policies for every table in 0001, and `accept_invitation(token)` RPC — the only path from invitation → membership, re-validates email match/expiry/status itself even though it's SECURITY DEFINER.
3. **`0003_operational_tables.sql`**: every remaining workbook sheet as a table — `budget_lines` (+ auto-seeds the 12 workbook categories), `vendors`, `expenses`, `guests`, `shopping_items`, `inventory_items`, `stay_arrangements`, `tasks`, `timeline_events`, `contacts`, `documents`. Also `wedding_announcements` (Dashboard's "Latest Announcement" — a single free-text cell in the real workbook, modeled as its own table rather than a `weddings` column so member+ can edit it without owner-level access).
4. **`0004_operational_rls.sql`**: uniform member/viewer RLS for everything in 0003, generated via a `do $$ ... foreach t in array [...] $$` loop rather than hand-writing ~40 near-identical policies.
5. **`0005_dashboard_stats.sql`**: `dashboard_stats` view, `security_invoker = true` (so Postgres applies the *querying user's* RLS to every underlying table, no separate grant needed). One query returns all 16 Dashboard KPIs (Budget×4, Guests×4, Tasks&Shopping×4, Vendors/Inventory/Stay×4) — matches the workbook's actual Dashboard sheet exactly (NOT the richer v2.md 16-card set, which has different cards like "Today's Payments").
6. **`0006_budget_summary.sql`**: `budget_summary` view — Actual Expense/Difference/Status/%Used are *always* derived live from `expenses`, matching the workbook's "don't type into the grey formula cells" rule. Only `estimated_amount` is a real editable column.
7. **`0007_seed_timeline_events.sql`**: seeds the 6 standard function rows (Engagement/Haldi/Mehendi/Sangeet/Wedding/Reception) on wedding creation, same as the workbook pre-fills them.
8. **`0008_wedding_info_lists.sql`**: `emergency_contacts`, `important_numbers` — the gap-fill mentioned above.
9. **`0009_documents_storage.sql`**: private Storage bucket `documents`, RLS on `storage.objects` keyed by treating the first path segment (`${wedding_id}/...`) as the tenant boundary, same isolation model as every table.
10. **`0010_notifications.sql`**: `notifications` table + RLS (`user_id = auth.uid()` only) + triggers: member-joined-via-invitation notifies active owners, role-change/removal notifies the affected user.
11. **`0011_fix_weddings_select_policy.sql`**: bug fix, see "Bug found and fixed" above. Reactive fix, applied only to `weddings` — not audited elsewhere yet.

**All 11 are applied** to the live project (`xniwyxobsfvifwdfrpwq`) as of this writing. For a fresh project, run `supabase db push` (or paste into SQL editor) 0001 through 0011 in order.

## Auth & multi-tenancy model

- Supabase Auth: email/password + Google OAuth (client wired, **no Google provider configured in any real Supabase project yet**), magic-link-style email verification, password reset.
- Every wedding-scoped table has `wedding_id`; every RLS policy goes through `is_wedding_member()`.
- Invitation flow: owner invites by email+role → row in `wedding_invitations` (token = uuid) → best-effort call to the `send-invitation-email` edge function → invitee visits `/invite/:token` → `accept_invitation()` RPC validates email match + expiry + status → membership created. If the invitee isn't logged in, `RequireAuth` redirects to `/auth/login` with `state.from` preserved, and `LoginPage` now honors that redirect (this was a real bug fixed mid-project — check this still works if you touch auth).
- Ownership transfer: promote-new-owner-then-demote-old-owner, in that order specifically, because the DB's last-owner guard trigger would reject the demote-first order.

## Routing

`src/app/router.tsx` — every module route under `/w/:weddingId/*` is **code-split** via React Router's data-router `lazy` field (not manual `React.lazy`+`Suspense` per route — the router handles it natively). The three routes outside the wedding shell (`WeddingListPage`, `CreateWeddingPage`, `AcceptInvitePage`) use manual `React.lazy` + a small `*Gate` wrapper component since they don't go through the same route-tree pattern. `RouteErrorBoundary` (`errorElement`) wraps the `/w/:weddingId` subtree; top-level auth routes are NOT covered by an error boundary — acceptable gap, noted, not fixed.

Bottom nav (mobile) + Sidebar (desktop) config lives in `src/app/navigation.ts` — `primaryNav` (5 items: Dashboard/Guests/Finance/Tasks/More) and `moreNav` (everything else, including the Notifications bell with an unread-count badge).

## What's genuinely untested vs. what's "build-clean"

**Never exercised against real data**: literally everything that requires a Supabase project — every CRUD flow, every RLS policy, the invitation email, file upload/download, realtime nothing (no realtime subscriptions were built — TanStack Query polling only, e.g. Dashboard refetches every 60s, Notifications every 60s).

**Verified only via throwaway static-data Playwright screenshots** (built, screenshotted, then deleted — search git history / this doc for "preview" if you need the pattern back): Dashboard KPI grid, Guests cards+table+dialog, Budget chart. Phases 6-9 reused already-proven primitives and skipped this step deliberately (documented reasoning each time: no new UI risk).

**Unit-tested** (Vitest + RTL, `npm test`): pure functions only — `formatCurrency`/`formatNumber`, vendor `remainingAmount`/`vendorStatus`, inventory `shortfall`, task `isOverdue` — plus 3 component smoke tests (Button, Checkbox, EmptyState). 22 tests, 7 files. **No integration tests, no e2e, no test touches Supabase.**

## Concrete next steps, roughly in order

1. **Create the real Supabase project.** Run all 10 migrations in order. Copy `.env.example` → `.env`, fill in `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`.
2. **`supabase gen types typescript --project-id <id> > src/types/database-generated.ts`**, then swap `src/lib/supabase.ts` back to `createClient<Database>(...)`. This closes the biggest type-safety gap in the codebase.
3. ~~Deploy the edge function~~ **Done.** `send-invitation-email` is deployed and confirmed sending real emails via Resend. Remaining: verify a domain in Resend when ready to invite people other than the account owner, and update `APP_URL` secret to the real Vercel URL post-deploy.
4. **Configure Google OAuth** in the Supabase Auth dashboard if you want that login path live.
5. **Walk the app as a real user, once, start to finish**: sign up → create wedding → invite a second account → accept invite → add a guest, an expense, a vendor, a task → confirm Dashboard numbers actually update → upload a document → check it downloads. Wedding creation and invitation-email delivery are now confirmed working; the rest of this list (guests/expenses/vendors/tasks/second-account-accept/dashboard-refresh/document-upload) is still unverified against real data.
6. ~~Settings page is a stub~~ **Built.** `src/features/settings/` — full CRUD UI over `list_options` (all 16 workbook dropdown lists), role-gated (viewer read-only, member add/edit/reorder, owner-only delete matching the RLS). Live-wired: edits here show up immediately in every other module's dropdowns since they share the same `useListOptions` query key.
7. **Sidebar was reorganized** (`src/app/navigation.ts` → `sidebarNavGroups`, `src/components/layout/Sidebar.tsx`): top group is workspace-level (Dashboard/Members/Settings), bottom group under a "Wedding Planning" label is all the data modules. Notifications was removed from the sidebar list (there's a bell icon with unread badge in `AppShell`'s top-right `TopActions` instead — `src/components/layout/AppShell.tsx`). Search was also removed as a sidebar nav link and replaced with an inline search box above the nav that navigates to `/w/:weddingId/search?q=...`; `SearchPage` reads that `q` param on mount and on subsequent navigations to the same route (via a `useEffect` on `searchParams`, since the route doesn't remount).
7. **Bundle size / perf**: code-splitting is done (initial chunk ~256KB gzip ~80KB), but recharts still makes `BudgetPage`'s chunk ~377KB — acceptable since it's lazy and only loads when Budget is visited, not blocking.
8. **No offline support, no PWA manifest** — "Offline Friendly" from the original brief was never addressed.
9. **Global Search** is client-side-filter-over-already-fetched-data (reuses each module's existing "fetch all" hook, small per-wedding datasets by design). Fine at current scale; would need real server-side search (Postgres full-text or similar) if guest/expense counts ever got large — they won't, per-wedding datasets are inherently small (30-60 families, etc.).

## Things that look like bugs but aren't (save yourself the debugging time)

- `.select(...).single().returns<T>()` chains on Supabase queries fail to compile with a `SelectQueryError`-flavored union type. Fixed pattern used throughout: drop `.returns<T>()` on `.single()` calls, do `if (!data) throw ...; return data as T;` instead. This is a known quirk of this postgrest-js version's `.single()` + `.returns()` interaction, not a real type error.
- `Database` type is intentionally NOT wired into the Supabase client (see Tech Stack section above) — this is not an oversight, don't "fix" it by trying to force the generic back in without first running `supabase gen types`.
- Empty `src/features/settings/` and `src/features/transport/` directories existed as scaffolding leftovers from Phase 1 (transport was renamed to `stay`, settings was never built) — deleted just before writing this doc. If they reappear from an old checkout, they're dead.
