# Wedding Management

Multi-tenant wedding planning app — guests, budget/expenses, tasks, shopping, inventory, vendors, timeline, stay arrangements, contacts, documents, and member roles per wedding.

- **Frontend**: React 19 + TypeScript + Vite + Tailwind, React Router, TanStack Query
- **Backend**: Node.js + Express + TypeScript + MySQL (`server/`)
- **Auth**: email/password (JWT + rotating refresh cookie) and Google OAuth
- **Email**: Nodemailer over SMTP (Gmail)

## Prerequisites

- Node.js 20+ and npm
- MySQL 8 running locally (or a Docker container) — a `wedding_management` database the app can connect to

## 1. Clone and install

```
git clone <this-repo-url>
cd "Wedding Managemnt"
npm install
cd server && npm install && cd ..
```

## 2. Configure environment

Two separate `.env` files — frontend at repo root, backend in `server/`.

**Root `.env`** (copy `.env.example`):
```
VITE_API_URL=http://localhost:3000/api
```

**`server/.env`** (copy `server/.env.example`):
```
PORT=3000
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=wedding_management
DATABASE_USER=root
DATABASE_PASSWORD=

JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d

FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=./uploads
COOKIE_SECURE=false
```

`JWT_SECRET` must be a long random string — generate one with:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

SMTP (email) and Google OAuth are optional for local dev — the app runs without them, just with invites/sign-in-with-Google disabled. Full setup steps for both are in [server/README.md](server/README.md).

## 3. Create the database

```
mysql -u root -p -e "CREATE DATABASE wedding_management"
```

Then apply migrations (auto-creates all tables):
```
cd server
npm run migrate
```

Migrations also run automatically on every backend startup, so this step is mainly for a first-time check that the DB connection works.

## 4. Run it

Two terminals, from repo root:

```
# terminal 1 — backend
cd server
npm run dev

# terminal 2 — frontend
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

Open the frontend URL, sign up, create a wedding.

## Project structure

```
src/                  frontend (React + Vite)
  features/<module>/  api.ts, hooks.ts, types.ts, *Page.tsx per module
  components/          shared UI (layout, ui primitives)
server/               backend (Express + TypeScript)
  src/controllers/    request handlers
  src/services/       business logic (email, google auth, ...)
  src/repositories/   MySQL queries
  src/routes/         route registration
  migrations/         numbered .sql files, applied in order
```

## Scripts

Frontend (repo root):
| Command | Purpose |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | typecheck + production build |
| `npm run test` | run tests |
| `npm run lint` | lint |

Backend (`server/`):
| Command | Purpose |
|---|---|
| `npm run dev` | dev server with auto-reload |
| `npm run build` | compile TypeScript |
| `npm run migrate` | apply pending migrations |
| `npm run typecheck` | typecheck only |

## More docs

- [server/README.md](server/README.md) — SMTP email setup, Google OAuth setup, how each is wired
- [MIGRATION_ANALYSIS.md](MIGRATION_ANALYSIS.md) — full backend architecture (schema, API, auth, multi-tenancy)
