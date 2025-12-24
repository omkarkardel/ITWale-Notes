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
echo "Creating lightweight wrapper function at repo-root api/"
mkdir -p api
cat > api/index.js <<'EOF'
// Vercel entry that delegates to compiled backend handler without breaking relative imports
module.exports = require('../backend/dist/api/index.js');
EOF

echo "Serverless wrapper created at api/index.js"
