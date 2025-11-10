import Link from 'next/link'
import Card from '@/components/ui/Card'
import Spotlight from '@/components/ui/Spotlight'
import ClientHero from './sections/ClientHero'

const years = [
  { key: 'SE', label: 'SE (2nd Year)', semesters: [3,4] },
  { key: 'TE', label: 'TE (3rd Year)', semesters: [5,6] },
  { key: 'BE', label: 'BE (4th Year)', semesters: [7,8] },
]

export default function Home() {
  return (
    <main>
      <Spotlight />
      <ClientHero />
      <section id="years" className="grid md:grid-cols-3 gap-4">
        {years.map(y => (
          <Card key={y.key}>
            <h2 className="font-semibold mb-2 text-lg">{y.label}</h2>
            <div className="flex gap-2">
              {y.semesters.map(s => (
                <Link key={s} className="px-3 py-1 rounded bg-blue-600 text-white text-sm" href={`/year/${y.key}/sem/${s}`}>Sem {s}</Link>
              ))}
            </div>
          </Card>
        ))}
      </section>
    </main>
  )
}
