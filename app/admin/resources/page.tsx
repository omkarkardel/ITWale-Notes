'use client'
import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function AdminResources() {
  useEffect(() => { (async () => {
    const me = await fetch('/api/auth/me')
    const m = await me.json()
    if (!m.user || m.user.role !== 'admin') { window.location.href = '/auth/login'; return }
  })() }, [])
  const [subjects, setSubjects] = useState<any[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [resources, setResources] = useState<any[]>([])
  const [q, setQ] = useState('')

  useEffect(() => { (async () => {
  const { apiFetch } = await import('@/lib/api-client')
  const res = await apiFetch('/subjects')
    if (res.ok) setSubjects(await res.json())
  })() }, [])

  async function loadResources() {
    const res = await fetch('/api/admin/resources' + (subjectId ? `?subjectId=${subjectId}` : ''))
    if (res.ok) setResources(await res.json())
  }

  async function save(r: any, patch: Partial<any>) {
    const res = await fetch('/api/admin/resources', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, ...patch }) })
    if (res.ok) await loadResources()
  }

  async function del(id: string) {
    if (!confirm('Delete resource?')) return
    const res = await fetch('/api/admin/resources?id=' + id, { method: 'DELETE' })
    if (res.ok) setResources(resources.filter(r => r.id !== id))
  }

  return (
    <main className="space-y-4">
      <h2 className="text-xl font-semibold">Admin - Resources</h2>
      <Card>
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div>
            <div className="text-sm text-gray-700 mb-1">Subject</div>
            <select className="border px-2 py-2 rounded w-full" value={subjectId} onChange={e=>setSubjectId(e.target.value)}>
              <option value="">All</option>
              {subjects.map((s:any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.year} Sem {s.semester})</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-sm text-gray-700 mb-1">Search title</div>
            <input className="border px-3 py-2 rounded w-full" value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g. Handwritten Notes" />
          </div>
          <Button onClick={loadResources} className="w-full">Load</Button>
        </div>
      </Card>
      <div className="grid gap-3">
        {resources.filter(r => r.title.toLowerCase().includes(q.toLowerCase())).map((r:any) => (
          <Card key={r.id}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-gray-600">{r.type} • Unit {r.unit?.unitNumber} • {r.unit?.examType}</div>
              </div>
              <div className="flex gap-2 items-center">
                <input className="border px-2 py-1 rounded w-40" defaultValue={r.title} onBlur={e=>save(r,{title:e.target.value})} />
                <input
                  className="border px-2 py-1 rounded w-28"
                  type="number"
                  step="0.01"
                  defaultValue={(r.price/100).toFixed(2)}
                  onBlur={e=>{
                    const rupees = parseFloat(e.target.value || '0')
                    const paise = Math.round(rupees * 100)
                    save(r,{price: paise})
                  }}
                />
                <select className="border px-2 py-1 rounded" defaultValue={r.type} onChange={e=>save(r,{type:e.target.value})}>
                  <option>HANDWRITTEN</option>
                  <option>QUESTION_BANK</option>
                  <option>BOOK</option>
                  <option>DECODE</option>
                  <option>PAPER</option>
                  <option>SOLUTION</option>
                </select>
                <Button variant="danger" onClick={()=>del(r.id)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
