'use client'
import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

type Subject = { id: string; name: string; year: string; semester: number }

export default function ClientHero() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
  const { apiFetch } = await import('@/lib/api-client')
  const res = await apiFetch('/subjects')
        if (res.ok) {
          setSubjects(await res.json())
          setError('')
        } else {
          let data: any = null
          try { data = await res.json() } catch {}
          setError((data && data.error) || `Failed to load subjects (${res.status})`)
        }
      } finally { setLoading(false) }
    })()
  }, [])

  const suggestions = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return subjects.slice(0, 8)
    return subjects.filter(s => s.name.toLowerCase().includes(k)).slice(0, 8)
  }, [q, subjects])

  return (
    <section className="py-10">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
          Ace SPPU Exams with Clean, Up‑to‑date Notes
        </h1>
        <p className="mt-3 prose-muted">
          Handwritten notes, PYQs with solutions, and decoded concepts. Pay once, lifetime access.
        </p>
        <div className="mt-6 max-w-xl mx-auto">
          <div className="relative">
            <input
              className="w-full rounded-xl border px-4 py-3 pr-28 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Try 'DBMS', 'Maths', 'CN' …"
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
            <div className="absolute right-2 top-2">
              <a href="#years">
                <Button>Browse all</Button>
              </a>
            </div>
          </div>
          {/* Suggestions */}
          <div className="mt-3 grid gap-2">
            {loading && <div className="text-sm text-gray-500">Loading subjects…</div>}
            {!loading && error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            {!loading && suggestions.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2">
                {suggestions.map(s => (
                  <a key={s.id} href={`/year/${s.year}/sem/${s.semester}`}>
                    <Card className="hover:translate-y-0.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-gray-600">{s.year} • Sem {s.semester}</div>
                        </div>
                        <span className="text-blue-600 text-sm">Open →</span>
                      </div>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a href="#years"><Button>Browse Notes</Button></a>
          <a href="/purchases"><Button variant="secondary">My Purchases</Button></a>
        </div>
      </div>
    </section>
  )
}
