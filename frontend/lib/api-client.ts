const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

// If a BACKEND_URL is provided we assume the path given is already the backend route
// (e.g. '/auth/login', '/orders/create'). We DO NOT prefix '/api' in that case because
// the Express backend routes are not mounted under '/api'. If BACKEND_URL is absent
// (local frontend-only scenario) we prefix '/api' so Next.js internal API routes would work.
export async function apiFetch(path: string, init?: RequestInit) {
  const trimmed = path.startsWith('/') ? path : `/${path}`
  const normalized = BACKEND_URL
    ? trimmed // remote backend: use path as-is
    : (trimmed.startsWith('/api') ? trimmed : `/api${trimmed}`) // local: ensure /api prefix
  const url = BACKEND_URL ? `${BACKEND_URL}${normalized}` : normalized
  const opts: RequestInit = { credentials: 'include', ...init }
  return fetch(url, opts)
}
