# @itwale/database

This package owns the Prisma schema and client (MongoDB only).

## Commands

- npm run prisma:generate — generate Prisma client
- npm run db:migrate:dev — Prisma db push (dev)
- npm run db:migrate:deploy — Prisma db push (prod)

## Environment

- DATABASE_URL must be set (MongoDB Atlas URI)

## Next steps

- Schema is Prisma MongoDB provider. Use `prisma db push` to sync schema.
- Import the client in backend (and optionally frontend server routes) from `database/src/client`.