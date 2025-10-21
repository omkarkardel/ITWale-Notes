<<<<<<< HEAD
# ITWale-Notes
=======
# ITWale Notes Shop (SPPU)

A minimal full-stack Next.js app to sell SPPU notes and PYQs with Razorpay payments, secure file delivery, and lifetime access after payment.

## Features

## Setup

# ITWale-Notes

Full-stack notes shop for SPPU — Next.js frontend, Express backend, Prisma ORM.

## Monorepo layout

- Frontend (Next.js) — at repo root
- Backend (Express) — `backend/`
- Database (Prisma schema + client) — `database/`

## Deploy overview

- Frontend → Vercel (root directory `/`)
- Backend → Render (root directory `backend/`)
- Database → Postgres (Neon/Supabase/Render PG) for persistence

## Environment variables

Common:
- JWT_SECRET

Frontend (Vercel):
- NEXT_PUBLIC_BACKEND_URL (Render backend URL)
- ALLOWED_CSRF_ORIGINS (include your Vercel domain)
- MERCHANT_NAME (optional)
- SMTP/S3 vars if used by Next.js server routes

Backend (Render):
- DATABASE_URL (Postgres URL)
- CORS_ORIGIN (your Vercel origin)
- JWT_SECRET (same strength as frontend)
- SMTP/S3 vars if used

## Database (Production)

Use Postgres for permanent storage. The `database/` package owns the Prisma schema.

Migrations (from local shell):

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
npm run prisma:migrate:deploy:pg
```

Optional initial seed:

```powershell
npm run prisma:generate:pg
npm run seed
```

## Local development

- Frontend: `npm run dev`
- Backend: `npm run backend:dev`
- Database: `npm run db:migrate:dev` (workspace: `@itwale/database`)

## Notes storage

- Development: local `uploads/`
- Production: configure S3 in `lib/s3.ts` and set credentials in env

## Deploy steps (high level)

1) Create Postgres (Neon/Supabase/Render PG) and set DATABASE_URL
2) Deploy Backend to Render (Root: backend, Build: `npm install; npm run build`, Start: `npm run start`, Health: `/health`)
3) Deploy Frontend to Vercel (Root: `/`, set NEXT_PUBLIC_BACKEND_URL and ALLOWED_CSRF_ORIGINS)
4) Apply migrations (see above) and verify admin flows
5) Point custom domains and update env/CORS/CSRF accordingly

## Automatic deploy via GitHub Actions

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs on push to `main` and does:

- Run Prisma migrations against `prisma/schema.postgres.prisma` using `DATABASE_URL` secret
- Build the frontend and deploy to Vercel using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`
- Trigger a Render backend deploy using `RENDER_API_KEY` and `RENDER_SERVICE_ID`

Required repository secrets (Settings → Secrets → Actions):

- DATABASE_URL — Postgres connection string
- VERCEL_TOKEN — personal token from Vercel
- VERCEL_ORG_ID — your Vercel org id
- VERCEL_PROJECT_ID — your Vercel project id
- NEXT_PUBLIC_BACKEND_URL — backend base URL after Render deploy
- RENDER_API_KEY — API key from Render
- RENDER_SERVICE_ID — Render service ID for your backend

After you add the secrets, pushing to `main` will run the workflow and automatically migrate the DB, deploy the frontend, and trigger a backend deploy.
- JWT_SECRET
