#!/usr/bin/env bash
set -euo pipefail

# Monorepo-aware build script for Vercel
# 1) Install workspace deps at repo root (workspace-aware)
# 2) Build the database package (Prisma client generation)
# 3) Build the backend

echo "Installing dependencies (workspace-aware)"
npm ci --workspaces --include-workspace-root

echo "Building database package"
npm run db:build

echo "Building backend"
npm run backend:build

echo "Build completed"

# Ensure Vercel can discover the serverless function.
# Vercel looks for functions under `api/` at the project root or in
# `.vercel/output/functions`. Copy the built backend serverless handler
# into `api/` so Vercel will route requests to it.
echo "Copying built serverless handler to repo-root api/ for Vercel"
mkdir -p api
if [ -d "backend/dist/api" ]; then
	# copy all built files from backend/dist/api into repo-root api/
	cp -r backend/dist/api/* api/ || true
elif [ -f "backend/dist/api/index.js" ]; then
	cp backend/dist/api/index.js api/index.js || true
fi

echo "Serverless handler staged at api/ (if build produced one)"
