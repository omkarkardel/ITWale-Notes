'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const { apiFetch } = await import('@/lib/api-client')
      const res = await apiFetch('/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }), timeoutMs: 15000 })
      let data: any = null
      try { data = await res.json() } catch { /* ignore */ }
      if (res.ok) {
        setMsg('Account created! Please login.'); window.location.href = '/auth/login'
      } else {
        const fallback = typeof data === 'object' && data?.error ? data.error : `Error (${res.status})`
        setMsg(fallback)
      }
    } catch (err: any) {
      setMsg(err?.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h2 className="text-xl font-semibold mb-4">Sign up</h2>
      <form onSubmit={onSubmit} className="max-w-sm space-y-3">
        <input className="w-full border px-3 py-2 rounded" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border px-3 py-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border px-3 py-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
  <button className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50" type="submit" disabled={loading}>{loading ? 'Signing up…' : 'Sign up'}</button>
        {msg && <div className="text-sm text-red-600">{msg}</div>}
      </form>
    </main>
  )
}
