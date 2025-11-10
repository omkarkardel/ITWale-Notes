import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function SubjectPage({ params }: { params: { year: string; sem: string; subjectId: string } }) {
  const { year, sem, subjectId } = params
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
  const base = `/year/${year}/sem/${sem}/subject/${subjectId}`
  return (
    <main>
      <h2 className="text-2xl font-bold mb-6">{subject?.name || 'Subject'} · {year} Sem {sem}</h2>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="p-5 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Insem</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200" href={`${base}/insem/unit/1`}>Unit 1</Link>
            <Link className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200" href={`${base}/insem/unit/2`}>Unit 2</Link>
            <Link className="px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100" href={`${base}/insem/pyq`}>Insem PYQ</Link>
            <Link className="px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100" href={`${base}/insem/solutions`}>Insem Solutions</Link>
          </div>
        </div>
        <div className="p-5 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Endsem</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200" href={`${base}/endsem/unit/3`}>Unit 3</Link>
            <Link className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200" href={`${base}/endsem/unit/4`}>Unit 4</Link>
            <Link className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200" href={`${base}/endsem/unit/5`}>Unit 5</Link>
            <Link className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200" href={`${base}/endsem/unit/6`}>Unit 6</Link>
            <Link className="px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100" href={`${base}/endsem/pyq`}>Endsem PYQ</Link>
            <Link className="px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100" href={`${base}/endsem/solutions`}>Endsem Solutions</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
