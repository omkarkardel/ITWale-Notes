import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/mongodb'

const validYears = ['SE','TE','BE']

export default async function SemPage({ params }: { params: { year: string; sem: string } }) {
  const { year, sem } = params
  if (!validYears.includes(year)) return notFound()
  const semNum = Number(sem)
  if (Number.isNaN(semNum)) return notFound()
  const db = await getDb()
  const subjects = await db.collection('Subject')
    .find({ year, semester: semNum })
    .sort({ name: 1 })
    .toArray()
  return (
    <main>
      <h2 className="text-2xl font-bold mb-4">{year} · Semester {sem}</h2>
      <ul className="grid md:grid-cols-2 gap-4">
        {subjects.map((s: any) => (
          <li key={s._id} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition">
            <div className="font-semibold">{s.name}</div>
            <div className="mt-3">
              <Link className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700" href={`/year/${year}/sem/${sem}/subject/${s._id}`}>Open Subject</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
