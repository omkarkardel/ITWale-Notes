# @itwale/backend

Express API for ITWale Notes.

## Scripts

- dev: tsx watch src/server.ts
- build: tsc -p tsconfig.json
- start: node dist/server.js

## Environment

- PORT (default 4000)
- CORS_ORIGIN (e.g. your Vercel frontend origin)
- DATABASE_URL (point to production Postgres for persistence)
- JWT_SECRET (required in production)

## Deploy (Render)

- Build Command: npm install; npm run build
- Start Command: npm run start
- Root Directory: backend
- Health Check: GET /health

# Backend service

Tech: Express + TypeScript
Port: 4000 (configurable via PORT)
CORS_ORIGIN must match your Next.js origin (http://localhost:3000 by default)

Run locally:
- Copy .env.example to .env and adjust values
- npm run dev --workspace @itwale/backend

Frontend wiring:
- Set NEXT_PUBLIC_BACKEND_URL=http://localhost:4000 in your Next.js .env to route API calls to this backend.
- Without it, the app will still call Next.js /api routes.

Notes:
- Uses @itwale/database Prisma client. Ensure you run: npm run db:generate and npm run db:migrate:dev at root as needed.
- For production, deploy this service separately and set NEXT_PUBLIC_BACKEND_URL on the frontend accordingly.