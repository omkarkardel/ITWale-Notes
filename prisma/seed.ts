import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function ensureUnitsAndBaseResources(subjectId: string, subjectName: string) {
  const existingUnits = await prisma.unit.findMany({ where: { subjectId } })
  if (existingUnits.length === 0) {
    for (let u = 1; u <= 6; u++) {
      const examType = u <= 2 ? 'INSEM' : 'ENDSEM'
      const unit = await prisma.unit.create({ data: { subjectId, unitNumber: u, examType } })
      // Mandatory resources per unit
      await prisma.resource.create({
        data: {
          unitId: unit.id,
          title: `${subjectName} - Unit ${u} Handwritten Notes`,
          type: 'HANDWRITTEN',
          price: 4999,
        },
      })
      await prisma.resource.create({
        data: {
          unitId: unit.id,
          title: `${subjectName} - Unit ${u} IMP Questions`,
          type: 'QUESTION_BANK',
          price: 2999,
        },
      })
    }
    // Add PYQ paper and solution entries for insem and endsem
    const units = await prisma.unit.findMany({ where: { subjectId } })
    const insemUnits = units.filter((u) => u.examType === 'INSEM')
    const endsemUnits = units.filter((u) => u.examType === 'ENDSEM')
    for (const tag of ['INSEM', 'ENDSEM'] as const) {
      await prisma.resource.create({
        data: {
          unitId: (tag === 'INSEM' ? insemUnits[0] : endsemUnits[0]).id,
          title: `${subjectName} ${tag} PYQ Papers`,
          type: 'PAPER',
          price: 2999,
        },
      })
      await prisma.resource.create({
        data: {
          unitId: (tag === 'INSEM' ? insemUnits[0] : endsemUnits[0]).id,
          title: `${subjectName} ${tag} PYQ Solutions`,
          type: 'SOLUTION',
          price: 3999,
        },
      })
    }
  }
  // Ensure mandatory resources exist for all existing units as well
  const unitsAll = await prisma.unit.findMany({ where: { subjectId } })
  for (const unit of unitsAll) {
    const resList = await prisma.resource.findMany({ where: { unitId: unit.id } })
    const hasHand = resList.some(r => r.type === 'HANDWRITTEN')
    const hasImp = resList.some(r => r.type === 'QUESTION_BANK')
    if (!hasHand) {
      await prisma.resource.create({ data: { unitId: unit.id, title: `${subjectName} - Unit ${unit.unitNumber} Handwritten Notes`, type: 'HANDWRITTEN', price: 4999 } })
    }
    if (!hasImp) {
      await prisma.resource.create({ data: { unitId: unit.id, title: `${subjectName} - Unit ${unit.unitNumber} IMP Questions`, type: 'QUESTION_BANK', price: 2999 } })
    }

    // Normalize titles if they drifted after subject renames
    for (const r of resList) {
      let expected: string | null = null
      if (r.type === 'HANDWRITTEN') expected = `${subjectName} - Unit ${unit.unitNumber} Handwritten Notes`
      else if (r.type === 'QUESTION_BANK') expected = `${subjectName} - Unit ${unit.unitNumber} IMP Questions`
      else if (r.type === 'PAPER') expected = `${subjectName} ${unit.examType} PYQ Papers`
      else if (r.type === 'SOLUTION') expected = `${subjectName} ${unit.examType} PYQ Solutions`
      if (expected && r.title !== expected) {
        await prisma.resource.update({ where: { id: r.id }, data: { title: expected } })
      }
    }
  }
}

async function updateSemSubjects(year: 'SE' | 'TE' | 'BE', semester: number, desiredNames: string[]) {
  // Helper to delete a subject with all dependent records
  async function deleteSubjectCascade(subjectId: string) {
    const units = await prisma.unit.findMany({ where: { subjectId }, select: { id: true } })
    const unitIds = units.map(u => u.id)
    if (unitIds.length) {
      const resources = await prisma.resource.findMany({ where: { unitId: { in: unitIds } }, select: { id: true } })
      const resourceIds = resources.map(r => r.id)
      if (resourceIds.length) {
        await prisma.orderItem.deleteMany({ where: { resourceId: { in: resourceIds } } })
        await prisma.purchase.deleteMany({ where: { resourceId: { in: resourceIds } } })
        await prisma.resource.deleteMany({ where: { id: { in: resourceIds } } })
      }
      await prisma.unit.deleteMany({ where: { id: { in: unitIds } } })
    }
    await prisma.subject.delete({ where: { id: subjectId } })
  }

  // order by createdAt ensures stable mapping across runs
  const existing = await prisma.subject.findMany({ where: { year, semester }, orderBy: { createdAt: 'asc' } })
  const ops: Promise<any>[] = []
  // Upsert the first five desired names in stable order
  for (let i = 0; i < Math.min(5, desiredNames.length); i++) {
    const name = desiredNames[i]
    if (existing[i]) {
      if (existing[i].name !== name) {
        ops.push(prisma.subject.update({ where: { id: existing[i].id }, data: { name } }))
      }
      ops.push(ensureUnitsAndBaseResources(existing[i].id, name))
    } else {
      ops.push((async () => {
        const created = await prisma.subject.create({ data: { name, year, semester } })
        await ensureUnitsAndBaseResources(created.id, name)
      })())
    }
  }
  await Promise.all(ops)

  // Reload and enforce exactly five unique subjects
  const after = await prisma.subject.findMany({ where: { year, semester }, orderBy: { createdAt: 'asc' } })
  const keepIds = new Set<string>()
  for (let i = 0; i < Math.min(5, after.length); i++) keepIds.add(after[i].id)
  const extras = after.filter(s => !keepIds.has(s.id))
  for (const s of extras) {
    await deleteSubjectCascade(s.id)
  }
}

async function createIfNotExists(year: 'SE' | 'TE' | 'BE', semester: number, names: string[]) {
  for (const name of names) {
    const found = await prisma.subject.findFirst({ where: { year, semester, name } })
    if (!found) {
      const created = await prisma.subject.create({ data: { name, year, semester } })
      await ensureUnitsAndBaseResources(created.id, name)
    }
  }
}

async function main() {
  // Create default admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123'
  const bcrypt = (await import('bcryptjs')).default as typeof import('bcryptjs')
  const hash = bcrypt.hashSync(adminPass, 10)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hash, role: 'admin' },
    create: { email: adminEmail, password: hash, role: 'admin', name: 'Admin' },
  })

  // Clean up deprecated admin emails
  const legacyAdmins = ['omkarvilas.kardel@matoshri.edu.in']
  for (const legacy of legacyAdmins) {
    if (legacy !== adminEmail) {
      const legacyUser = await prisma.user.findUnique({ where: { email: legacy } })
      if (legacyUser) {
        await prisma.purchase.deleteMany({ where: { userId: legacyUser.id } })
        const legacyOrders = await prisma.order.findMany({ where: { userId: legacyUser.id }, select: { id: true } })
        const legacyOrderIds = legacyOrders.map(o => o.id)
        if (legacyOrderIds.length) {
          await prisma.orderItem.deleteMany({ where: { orderId: { in: legacyOrderIds } } })
          await prisma.order.deleteMany({ where: { id: { in: legacyOrderIds } } })
        }
        await prisma.user.delete({ where: { id: legacyUser.id } })
      }
    }
  }

  // Enforce exactly five subjects ONLY for requested semesters
  await updateSemSubjects('SE', 3, ['DM', 'LDCO', 'OOP', 'DSA', 'BCN'])
  await updateSemSubjects('SE', 4, ['DBMS', 'CG', 'PA', 'M-3', 'SE'])
  await updateSemSubjects('TE', 5, ['TOC', 'HCI', 'OS', 'ML', 'ADBMS'])
  // Add requested new semesters/subjects
  await updateSemSubjects('TE', 6, ['CNS', 'DSBDA', 'WAD', 'Elective - 2'])
  await updateSemSubjects('BE', 7, ['ISR', 'SPM', 'Deep Learning', 'Elective-3', 'Elective-4'])
  await updateSemSubjects('BE', 8, ['DS', 'Elective-5', 'Elective-6'])
  // Leave other semesters as-is; they can be curated later

  console.log('Seed completed')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
