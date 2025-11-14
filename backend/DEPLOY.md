Vercel deployment notes for backend

Recommended Vercel project settings (monorepo)

- Project Root: leave empty (use repository root)
- Install Command: leave empty (we run installation in script)
- Build Command: bash vercel-build.sh
- Output Directory: backend/dist
- Node Version: 18 (ensure Vercel runtime is set to 18 or 20)

Environment variables (set in Vercel Dashboard -> Project -> Settings -> Environment Variables):
- DATABASE_URL = <your MongoDB URI>
- JWT_SECRET = <your jwt secret>
- CORS_ORIGIN = <frontend origin>
- MAIL_USE_SMTP, SMTP_* (if using SMTP email)
- Any payment keys required by your app

If you prefer to set Project Root = backend instead of repo root, set:
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

Troubleshooting
- If you see "Command \"npm ci\" exited with 1" in Vercel logs, switch to the repo-root build (this script) so workspace/local file: refs are resolved.
- If you must build from the backend folder, use `npm install` instead of `npm ci` in Vercel Install Command.
