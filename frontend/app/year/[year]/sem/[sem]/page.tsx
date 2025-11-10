import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const validYears = ['SE','TE','BE']

type Subject = { id: string; name: string }
export default async function SemPage({ params }: { params: { year: string; sem: string } }) {
  const { year, sem } = params
  if (!validYears.includes(year)) return notFound()
  const semNum = Number(sem)
  if (Number.isNaN(semNum)) return notFound()
  const subjects: Subject[] = await prisma.subject.findMany({ where: { year, semester: semNum }, orderBy: { name: 'asc' } })
  return (
    <main>
      <h2 className="text-2xl font-bold mb-4">{year} · Semester {sem}</h2>
      <ul className="grid md:grid-cols-2 gap-4">
        {subjects.map((s: Subject) => (
          <li key={s.id} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition">
            <div className="font-semibold">{s.name}</div>
            <div className="mt-3">
              <Link className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700" href={`/year/${year}/sem/${sem}/subject/${s.id}`}>Open Subject</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
