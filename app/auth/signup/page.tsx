'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
  const { apiFetch } = await import('@/lib/api-client')
  const res = await apiFetch('/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) })
    const data = await res.json()
    if (res.ok) {
      setMsg('Account created! Please login.'); window.location.href = '/auth/login'
    } else {
      setMsg(data.error || 'Error')
    }
  }

  return (
    <main>
      <h2 className="text-xl font-semibold mb-4">Sign up</h2>
      <form onSubmit={onSubmit} className="max-w-sm space-y-3">
        <input className="w-full border px-3 py-2 rounded" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border px-3 py-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border px-3 py-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-3 py-2 bg-blue-600 text-white rounded" type="submit">Sign up</button>
        {msg && <div className="text-sm text-red-600">{msg}</div>}
      </form>
    </main>
  )
}
