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
