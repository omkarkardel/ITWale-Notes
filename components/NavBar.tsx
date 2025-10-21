'use client'
import { useEffect, useState } from 'react'

export default function NavBar() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      try {
  const { apiFetch } = await import('@/lib/api-client')
  const res = await apiFetch('/auth/me')
        const data = await res.json()
        setUser(data.user)
      } catch {}
    })()
  }, [])

  async function logout() {
  const { apiFetch } = await import('@/lib/api-client')
  await apiFetch('/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return (
    <nav className="text-sm flex gap-2 items-center">
      {user?.role === 'admin' ? (
        <a className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300" href="/admin/purchases">User Purches</a>
      ) : (
        <a className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300" href="/purchases">My Purchases</a>
      )}
      {user ? (
        <>
          {user.role === 'admin' && (
            <>
              <a className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700" href="/admin">Admin</a>
              <a className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300" href="/admin/resources">Resources</a>
              <a className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300" href="/admin/upload">Upload</a>
            </>
          )}
          <span className="text-gray-600 hidden md:inline">{user.email}</span>
          <button className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <a className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300" href="/auth/login">Login</a>
          <a className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700" href="/auth/signup">Sign up</a>
        </>
      )}
    </nav>
  )
}
