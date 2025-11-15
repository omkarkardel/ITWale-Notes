const RAW_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
const BACKEND_URL = RAW_BACKEND_URL ? RAW_BACKEND_URL.replace(/\/+$/, '') : ''

type ApiFetchOptions = RequestInit & { timeoutMs?: number }

// If a BACKEND_URL is provided we assume the path given is already the backend route
// (e.g. '/auth/login', '/orders/create'). We DO NOT prefix '/api' in that case because
// the Express backend routes are not mounted under '/api'. If BACKEND_URL is absent
// (local frontend-only scenario) we prefix '/api' so Next.js internal API routes would work.
export async function apiFetch(path: string, init?: ApiFetchOptions) {
  const trimmed = path.startsWith('/') ? path : `/${path}`
  const normalized = BACKEND_URL
    ? trimmed // remote backend: use path as-is
    : (trimmed.startsWith('/api') ? trimmed : `/api${trimmed}`) // local: ensure /api prefix
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
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    // Likely CORS/network/DNS error
    throw new Error(err?.message || 'Network error while contacting the server')
  } finally {
    clearTimeout(id)
  }
}
