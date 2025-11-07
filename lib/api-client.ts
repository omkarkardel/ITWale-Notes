const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function apiFetch(path: string, init?: RequestInit) {
  // Normalize path to always hit /api/* regardless of where we send it
  const normalized = path.startsWith('/api') ? path : `/api${path}`
  const url = BACKEND_URL ? `${BACKEND_URL}${normalized}` : normalized
  const opts: RequestInit = { credentials: 'include', ...init }
  return fetch(url, opts)
}
