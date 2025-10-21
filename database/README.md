# @itwale/database

Phase 1 extraction of the database layer. This package owns the Prisma schema and client.

## Commands

- npm run prisma:generate — generate Prisma client
- npm run prisma:migrate:dev — create/apply dev migrations
- npm run prisma:migrate:deploy — apply migrations in production

## Environment

- DATABASE_URL must be set (SQLite dev or Postgres in prod)

## Next steps

- Switch datasource to Postgres in production.
- Import the client in backend (and optionally frontend server routes) from `database/src/client`.