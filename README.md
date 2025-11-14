
# ITWale-Notes

# ITWale Notes Shop (SPPU)

Full-stack notes shop for SPPU — Next.js App Router, Prisma ORM, and MongoDB Atlas. Manual PhonePe payments with admin “mark paid” unlock access. Secure file delivery with signed downloads.

## Monorepo layout

- Frontend (Next.js) — repo root
- Backend (optional Express) — `backend/` (Render blueprint included)
- Database (Prisma schema + client) — `database/`

## Tech

- Next.js 14 (App Router), React 18, Tailwind CSS
- Prisma Client 5 (MongoDB provider)
- JWT auth via httpOnly cookie
- CSRF via Origin/Referer allow-list + simple rate limiting
- Local uploads in dev; S3-compatible storage recommended in prod

## Quick start (local)

Prereqs: Node.js 20+, MongoDB Atlas URI

1) Create `.env` in repo root

```powershell
# Required
$env:DATABASE_URL = "mongodb+srv://USER:PASS@CLUSTER/dbname?retryWrites=true&w=majority"
$env:JWT_SECRET = "change-me"

# Optional: allow extra dev origins for CSRF (comma-separated)
$env:ALLOWED_CSRF_ORIGINS = "http://localhost:3000"
```

2) Install, generate client, sync schema, and seed

```powershell
npm ci
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
npm run seed
```

3) Run the app

```powershell
npm run dev
```

Seed creates an admin account using env vars if present:

- `ADMIN_EMAIL` (default: admin@example.com)
- `ADMIN_PASSWORD` (default: admin123)

## Auth notes (important)

- Cookies: httpOnly, SameSite is dynamic
	- Same-site (default): SameSite=Lax
	- Cross-site (frontend and API on different domains): SameSite=None; Secure
- CSRF: requests must come from the same origin or from an origin listed in `ALLOWED_CSRF_ORIGINS`
- CORS: auth routes implement `OPTIONS` and echo `Access-Control-Allow-Origin` for allowed origins; credentials are enabled
- If you deploy frontend and API on the same domain (recommended), do NOT set `NEXT_PUBLIC_BACKEND_URL` and the app will call Next.js API routes directly
- If you deploy a separate backend domain, set:
	- `NEXT_PUBLIC_BACKEND_URL` on the frontend (e.g., https://your-backend.onrender.com)
	- Include the frontend origin in `ALLOWED_CSRF_ORIGINS`
	- Ensure HTTPS everywhere (SameSite=None requires Secure)

## Storage

- Dev: local `uploads/`
- Prod: configure S3 in `lib/s3.ts` and set: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` (optional)

## CI / Deploy

GitHub Actions workflow `.github/workflows/deploy.yml` runs on push to `main`:

1) Sync DB schema (Mongo): `prisma db push` using `secrets.DATABASE_URL`
2) Build and deploy frontend to Vercel (pull/build/deploy)
3) Trigger backend deploy on Render (optional)

Required repo secrets (Settings → Secrets → Actions):

- `DATABASE_URL` — MongoDB Atlas connection string
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `RENDER_API_KEY`, `RENDER_SERVICE_ID` (only if using the separate backend)
- Optional: `NEXT_PUBLIC_BACKEND_URL` (if frontend calls separate backend)
- `JWT_SECRET` — same across frontend/backends

Render blueprint `render.yaml` is provided for `backend/` and expects `DATABASE_URL` to be set (Mongo URI).

## Troubleshooting

- Prisma error: “the URL must start with protocol mongo” → set `DATABASE_URL` to a MongoDB URI and re-run `npx prisma db push`.
- Cookies not set after login on production → you’re likely on separate domains; ensure HTTPS and that `ALLOWED_CSRF_ORIGINS` includes your frontend origin. The app will set SameSite=None for cross-site responses.
- 403 “Bad origin” on auth routes → Origin/Referer didn’t match; update `ALLOWED_CSRF_ORIGINS`.
- Admin not visible → ensure your seeded admin email is used and role is ‘admin’ in DB.

## License

MIT
2) Build and deploy the frontend to Vercel (pull/build/deploy flow)
