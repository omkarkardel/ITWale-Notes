const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function apiFetch(path: string, init?: RequestInit) {
  // If BACKEND_URL is set, call the standalone backend. Otherwise, fall back to Next.js /api/* routes.
  const url = BACKEND_URL ? `${BACKEND_URL}${path}` : path.startsWith('/api') ? path : `/api${path}`
  const opts: RequestInit = { credentials: 'include', ...init }
  // If calling backend, ensure absolute URL and include cookies
  return fetch(url, opts)
}
