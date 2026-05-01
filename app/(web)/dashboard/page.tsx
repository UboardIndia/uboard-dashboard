'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Submission { user_id: string; submission_type: string; submitted_at: string }
interface Cycle { id: string; cycle_month: string; status: string }

const SUBMISSION_LABELS: Record<string, string> = {
  readiness_gopalji: 'Gopalji — Tranzact Readiness',
  readiness_altab: 'Altab — Sheet Readiness',
  readiness_furkan: 'Furkan — Closing Stock',
  defects_kashif: 'Kashif — Defective Units',
  physical_count_arjun: 'Arjun — Physical Count',
  returns_arti: 'Arti — Returns In Transit',
}

const REQUIRED_TYPES = Object.keys(SUBMISSION_LABELS)

export default function DashboardPage() {
  const router = useRouter()
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [compiling, setCompiling] = useState(false)
  const [compileMsg, setCompileMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }

    async function load() {
      const cycleRes = await fetch('/api/v1/cycles/active', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => null)
      if (cycleRes?.cycle) {
        setCycle(cycleRes.cycle)
        const subRes = await fetch(`/api/v1/cycles/${cycleRes.cycle.id}/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => null)
        setSubmissions(subRes?.submissions ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  const submittedTypes = submissions.map((s) => s.submission_type)
  const pending = REQUIRED_TYPES.filter((t) => !submittedTypes.includes(t))
  const allSubmitted = pending.length === 0
  const daysUntilCutoff = cycle ? Math.ceil((new Date(cycle.cycle_month.split('-')[0] + '-' + cycle.cycle_month.split('-')[1] + '-28').getTime() - Date.now()) / 86400000) : 0

  async function handleCompile() {
    setCompileMsg('')
    setCompiling(true)
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/v1/cycles/${cycle!.id}/report/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ opening_stock: 0, total_inward: 0, returnable_out: 0, returned: 0 }),
    }).then((r) => r.json()).catch(() => null)
    setCompiling(false)
    if (res?.error) {
      setCompileMsg(res.error + (res.missing ? ': ' + res.missing.join(', ') : ''))
    } else {
      setCompileMsg('Report compiled successfully!')
    }
  }

  async function handleRemind(subType: string) {
    const token = localStorage.getItem('token')
    const label = SUBMISSION_LABELS[subType]
    await fetch('/api/v1/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: 'placeholder', cycle_id: cycle?.id, message: `Reminder: Please submit ${label}` }),
    })
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
      {cycle && <p className="text-gray-500 mb-6">Active cycle: {cycle.cycle_month} — Status: {cycle.status}</p>}

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Submitted', value: submittedTypes.length, color: 'text-green-600' },
          { label: 'Pending', value: pending.length, color: 'text-amber-600' },
          { label: 'Required', value: REQUIRED_TYPES.length, color: 'text-blue-600' },
          { label: 'Days to Deadline', value: daysUntilCutoff > 0 ? daysUntilCutoff : 0, color: daysUntilCutoff <= 2 ? 'text-red-600' : 'text-gray-800' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Location banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700">
        Okhla Factory — {cycle?.cycle_month} Reconciliation
      </div>

      {/* Submissions list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-700">Submission Status</div>
        {REQUIRED_TYPES.map((type) => {
          const sub = submissions.find((s) => s.submission_type === type)
          return (
            <div key={type} className="flex items-center px-6 py-4 border-b border-gray-50 last:border-0">
              <span className={`w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0 ${sub ? 'bg-green-500' : 'bg-amber-400'}`} />
              <span className="flex-1 text-sm text-gray-700">{SUBMISSION_LABELS[type]}</span>
              {sub ? (
                <span className="text-xs text-gray-400">{new Date(sub.submitted_at).toLocaleString()}</span>
              ) : (
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Pending</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Compile button */}
      {compileMsg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${compileMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {compileMsg}
        </div>
      )}
      <button
        onClick={handleCompile}
        disabled={!allSubmitted || compiling || !cycle}
        className="px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
      >
        {compiling ? 'Compiling...' : allSubmitted ? 'Compile Report' : `Compile Report (${pending.length} submissions missing)`}
      </button>
    </div>
  )
}
