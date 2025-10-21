"use client"
import { useEffect, useMemo, useState } from "react"

type Year = "SE" | "TE" | "BE"
const YEAR_ORDER: Record<Year, number> = { SE: 1, TE: 2, BE: 3 }

export default function AdminUpload() {
  useEffect(() => {
    ;(async () => {
      const me = await fetch("/api/auth/me")
      const m = await me.json()
      if (!m.user || m.user.role !== "admin") {
        window.location.href = "/auth/login"
        return
      }
    })()
  }, [])

  const [allSubjects, setAllSubjects] = useState<any[]>([])
  const [year, setYear] = useState<Year | "">("")
  const [sem, setSem] = useState<number | "">("")
  const [subjectId, setSubjectId] = useState("")
  const [exam, setExam] = useState<"INSEM" | "ENDSEM" | "">("")
  const [target, setTarget] = useState<string>("") // Unit1..6 or PYQ_PAPERS / PYQ_SOLUTIONS
  const [type, setType] = useState<"HANDWRITTEN" | "QUESTION_BANK" | "">("")
  const [priceRupees, setPriceRupees] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [isFree, setIsFree] = useState<boolean>(false)
  const [msg, setMsg] = useState("")
  const [preview, setPreview] = useState<any | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
  const { apiFetch } = await import('@/lib/api-client')
  const res = await apiFetch("/subjects")
        if (res.ok) {
          const subs = await res.json()
          subs.sort(
            (a: any, b: any) =>
              (YEAR_ORDER[a.year as Year] - YEAR_ORDER[b.year as Year]) ||
              a.semester - b.semester ||
              a.name.localeCompare(b.name)
          )
          setAllSubjects(subs)
        }
      } catch {}
    })()
  }, [])

  const years = ["SE", "TE", "BE"] as Year[]
  const sems = useMemo(() => (year ? [3, 4, 5, 6, 7, 8] : []), [year])
  const subjects = useMemo(
    () =>
      allSubjects.filter((s) => (year ? s.year === year : true) && (sem ? s.semester === sem : true)),
    [allSubjects, year, sem]
  )

  function resetBelow(level: "year" | "sem" | "subject" | "exam" | "target") {
    if (level === "year") {
      setSem("")
      setSubjectId("")
      setExam("")
      setTarget("")
      setType("")
      setPriceRupees("")
    } else if (level === "sem") {
      setSubjectId("")
      setExam("")
      setTarget("")
      setType("")
      setPriceRupees("")
    } else if (level === "subject") {
      setExam("")
      setTarget("")
      setType("")
      setPriceRupees("")
    } else if (level === "exam") {
      setTarget("")
      setType("")
      setPriceRupees("")
    } else if (level === "target") {
      setType("")
      setPriceRupees("")
    }
  }

  function targetOptions() {
    if (exam === "INSEM") return ["Unit1", "Unit2", "Insem PYQ Papers", "Insem PYQ Solutions"]
    if (exam === "ENDSEM") return ["Unit3", "Unit4", "Unit5", "Unit6", "Endsem PYQ Papers", "Endsem PYQ Solutions"]
    return []
  }

  const needsType = target.startsWith("Unit")

  // Derive selection to query existing resource without creating it
  function deriveSelection(): { unitNumber?: number; examType?: "INSEM" | "ENDSEM"; resType?: string } | null {
    if (!subjectId || !exam || !target) return null
    if (target.startsWith("Unit")) {
      const unitNumber = Number(target.replace("Unit", ""))
      const resType = type || undefined
      return { unitNumber, examType: unitNumber <= 2 ? "INSEM" : "ENDSEM", resType }
    }
    // PYQ targets
    const resType = target.includes("Papers") ? "PAPER" : "SOLUTION"
    return { examType: exam, resType }
  }

  // Load preview of existing resource
  useEffect(() => {
    ;(async () => {
      setPreview(null)
      if (!subjectId || !exam || !target) return
      const sel = deriveSelection()
  if (!sel || !sel.resType) return
      setLoadingPreview(true)
      try {
        let body: any = { subjectId }
        if (sel.unitNumber) body.units = [sel.unitNumber]
        if (sel.examType) body.examType = sel.examType
        if (sel.resType) body.type = sel.resType
        // Do not enforce hasFile here; we want to know if file exists or not
        const res = await fetch('/api/resources/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (res.ok) {
          const list = await res.json()
          // Expect at most one
          const r = Array.isArray(list) ? list[0] : null
          setPreview(r || null)
          // If existing price and no manual input yet, prefill rupees
          if (r && (priceRupees === '' || priceRupees == null)) {
            const pr = (r.price ?? 0) / 100
            if (pr > 0) { setPriceRupees(pr.toFixed(2)); setIsFree(false) } else { setPriceRupees(''); setIsFree(true) }
          }
        }
      } finally {
        setLoadingPreview(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, exam, target, type])

  function canonicalTitleClient(): string | null {
    const sel = deriveSelection()
    if (!sel || !sel.resType) return null
    const subj = subjects.find((s:any) => s.id === subjectId)
    const name = subj?.name || 'Subject'
    if (sel.resType === 'HANDWRITTEN' && sel.unitNumber) return `${name} - Unit ${sel.unitNumber} Handwritten Notes`
    if (sel.resType === 'QUESTION_BANK' && sel.unitNumber) return `${name} - Unit ${sel.unitNumber} IMP Questions`
    if (sel.resType === 'PAPER' && sel.examType) return `${name} ${sel.examType} PYQ Papers`
    if (sel.resType === 'SOLUTION' && sel.examType) return `${name} ${sel.examType} PYQ Solutions`
    return null
  }

  async function resolveResource(): Promise<string | null> {
    if (!subjectId || !exam || !target) return null
    let unitNumber: number | undefined
    let examType: "INSEM" | "ENDSEM" | undefined
    let resType: any
    if (target.startsWith("Unit")) {
      unitNumber = Number(target.replace("Unit", ""))
      examType = unitNumber <= 2 ? "INSEM" : "ENDSEM"
      resType = type || "HANDWRITTEN"
    } else {
      examType = exam
      if (target.includes("Papers")) resType = "PAPER"
      else resType = "SOLUTION"
    }
    const payload: any = { subjectId, type: resType }
    if (typeof unitNumber === "number") payload.unitNumber = unitNumber
    else payload.examType = examType
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const data = await res.json()
    const paise = isFree ? 0 : Math.round((parseFloat(priceRupees || "0") || 0) * 100)
    if (data?.resource?.id) {
      // set/update price immediately so front-end shows right price
      await fetch("/api/admin/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.resource.id, price: paise }),
      })
    }
    return data?.resource?.id || null
  }

  async function onUpload(e: React.FormEvent) {
    e.preventDefault()
    setMsg("")
    if (!file) return setMsg("Pick a file")
    const rid = await resolveResource()
    if (!rid) return setMsg("Could not resolve resource")
    const fd = new FormData()
    fd.append("resourceId", rid)
    fd.append("file", file)
    const res = await fetch("/api/files/upload", { method: "POST", body: fd })
    const data = await res.json().catch(() => ({} as any))
    if (res.ok) setMsg(`Uploaded ✓ Saved at: ${data.filePath || "(unknown)"}`)
    else setMsg(`Upload failed: ${data.error || "Unknown error"}`)
  }

  return (
    <main className="space-y-4">
      <h2 className="text-xl font-semibold">Admin - Guided Upload</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 border rounded bg-white space-y-3">
          <div>
            <div className="text-sm text-gray-700 mb-1">Year</div>
            <select
              className="border px-3 py-2 rounded w-full"
              value={year}
              onChange={(e) => {
                setYear(e.target.value as Year)
                resetBelow("year")
              }}
            >
              <option value="">-- select year --</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {year && (
            <div>
              <div className="text-sm text-gray-700 mb-1">Semester</div>
              <select
                className="border px-3 py-2 rounded w-full"
                value={sem as any}
                onChange={(e) => {
                  setSem(Number(e.target.value))
                  resetBelow("sem")
                }}
              >
                <option value="">-- select semester --</option>
                {sems.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          {sem && (
            <div>
              <div className="text-sm text-gray-700 mb-1">Subject</div>
              <select
                className="border px-3 py-2 rounded w-full"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value)
                  resetBelow("subject")
                }}
              >
                <option value="">-- select subject --</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {subjectId && (
            <div>
              <div className="text-sm text-gray-700 mb-1">Exam</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`px-3 py-2 rounded border ${exam === "INSEM" ? "bg-blue-600 text-white" : "bg-gray-50"}`}
                  onClick={() => {
                    setExam("INSEM")
                    resetBelow("exam")
                  }}
                >
                  Insem
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded border ${exam === "ENDSEM" ? "bg-blue-600 text-white" : "bg-gray-50"}`}
                  onClick={() => {
                    setExam("ENDSEM")
                    resetBelow("exam")
                  }}
                >
                  Endsem
                </button>
              </div>
            </div>
          )}
          {exam && (
            <div>
              <div className="text-sm text-gray-700 mb-1">Target</div>
              <select
                className="border px-3 py-2 rounded w-full"
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value)
                  resetBelow("target")
                }}
              >
                <option value="">-- choose --</option>
                {targetOptions().map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
          {needsType && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`px-3 py-2 rounded border ${type === "HANDWRITTEN" ? "bg-green-600 text-white" : "bg-gray-50"}`}
                onClick={() => setType("HANDWRITTEN")}
              >
                Handwritten Notes
              </button>
              <button
                type="button"
                className={`px-3 py-2 rounded border ${type === "QUESTION_BANK" ? "bg-amber-600 text-white" : "bg-gray-50"}`}
                onClick={() => setType("QUESTION_BANK")}
              >
                IMP Questions Bank
              </button>
            </div>
          )}
          {(target && (type || !needsType)) && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="text-sm text-gray-700">Pricing</div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isFree} onChange={(e)=>{ setIsFree(e.target.checked); if (e.target.checked) setPriceRupees('') }} />
                  Make this resource free
                </label>
              </div>
              {!isFree && (
                <>
                  <input
                    type="number"
                    className="border px-3 py-2 rounded w-full"
                    value={priceRupees}
                    min={0}
                    step={0.01 as any}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    placeholder="e.g. 49.99"
                  />
                  <div className="text-xs text-gray-600 mt-1">Price in rupees; we convert to paise automatically.</div>
                </>
              )}
            </div>
          )}
        </div>
        <form className="p-3 border rounded bg-white space-y-3" onSubmit={onUpload}>
          <div>
            <div className="text-sm text-gray-700 mb-1">Pick File</div>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="text-sm text-gray-700">Preview</div>
          <div className="border rounded p-3 bg-gray-50 text-sm space-y-1">
            {(!subjectId || !exam || !target || (needsType && !type)) ? (
              <div>Complete selections above to preview the target resource.</div>
            ) : loadingPreview ? (
              <div>Loading preview…</div>
            ) : (
              <div className="space-y-1">
                <div><span className="text-gray-600">Title:</span> <span className="font-medium">{canonicalTitleClient() || '—'}</span></div>
                <div><span className="text-gray-600">Current Price:</span> { (isFree || (preview && (preview.price||0)===0)) ? (<span className="text-green-700 font-medium">Free</span>) : (<>₹{preview ? ((preview.price||0)/100).toFixed(2) : (priceRupees || '0.00')}</>) }</div>
                <div><span className="text-gray-600">Has File:</span> {preview && preview.filePath ? 'Yes' : 'No'}</div>
                <div><span className="text-gray-600">Will Create If Missing:</span> {preview ? 'No' : 'Yes'}</div>
              </div>
            )}
          </div>
          <button
            className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-60"
            type="submit"
            disabled={!subjectId || !exam || !target || (needsType && !type) || !file}
          >
            Upload
          </button>
          {msg && <div className="text-sm">{msg}</div>}
        </form>
      </div>
    </main>
  )
}
