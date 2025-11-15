// Shared API client used by app pages. Adjusts path handling based on whether
// we are calling a remote backend (NEXT_PUBLIC_BACKEND_URL set) or using local
// Next.js route handlers under /api.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

type ApiFetchOptions = RequestInit & { timeoutMs?: number }

export async function apiFetch(path: string, init?: ApiFetchOptions) {
  const trimmed = path.startsWith('/') ? path : `/${path}`
  // Remote backend: do NOT prefix /api because Express mounts routes at root (e.g. /auth/login)
  // Local (no BACKEND_URL): ensure /api prefix to hit Next.js route handlers
  const normalized = BACKEND_URL
    ? trimmed
    : (trimmed.startsWith('/api') ? trimmed : `/api${trimmed}`)

  const url = BACKEND_URL ? `${BACKEND_URL}${normalized}` : normalized
  const { timeoutMs = 15000, ...rest } = init || {}
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  const opts: RequestInit = {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(rest.headers || {}) },
    ...rest,
    signal: controller.signal,
  }
  try {
    const res = await fetch(url, opts)
    return res
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('Request timed out. Please try again.')
    throw new Error(err?.message || 'Network error while contacting the server')
  } finally {
    clearTimeout(id)
  }
}
