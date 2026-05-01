'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const EV_PRODUCTS = [
  'U-Board E1', 'U-Board E2', 'U-Board Pro', 'U-Board Lite', 'U-Board Max'
]

export default function ReadinessPage() {
  const router = useRouter()
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [inwardReady, setInwardReady] = useState(false)
  const [outwardReady, setOutwardReady] = useState(false)
  const [sheetReady, setSheetReady] = useState(false)
  const [tranzactVerified, setTranzactVerified] = useState(false)
  const [sellable, setSellable] = useState('')
  const [unassembled, setUnassembled] = useState('')
  const [defective, setDefective] = useState('')
  const [discontinued, setDiscontinued] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submittedAt, setSubmittedAt] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const r = localStorage.getItem('role') ?? ''
    const n = localStorage.getItem('userName') ?? ''
    setRole(r)
    setName(n)
    if (!token) { router.replace('/login'); return }
    if (!['factory_staff', 'admin'].includes(r)) { router.replace('/home'); return }

    fetch('/api/v1/cycles/active', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.cycle) {
          setCycleId(d.cycle.id)
          // Check if already submitted
          return fetch(`/api/v1/cycles/${d.cycle.id}/submissions/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json())
        }
      })
      .then((d) => {
        const type = name === 'Altab' ? 'readiness_altab' : name === 'Furkan' ? 'readiness_furkan' : 'readiness_gopalji'
        const existing = d?.submissions?.find((s: { submission_type: string }) => s.submission_type === type)
        if (existing) {
          setSubmitted(true)
          setSubmittedData(JSON.parse(existing.data_json))
          setSubmittedAt(existing.submitted_at)
        }
      })
      .catch(() => {})
  }, [router, name])

  const isGopalji = name === 'Gopalji'
  const isAltab = name === 'Altab'
  const isFurkan = name === 'Furkan'

  const canSubmit = isGopalji
    ? inwardReady && outwardReady
    : isAltab
    ? sheetReady
    : tranzactVerified && sellable !== '' && unassembled !== '' && defective !== '' && discontinued !== ''

  async function handleSubmit() {
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    let submission_type = 'readiness_gopalji'
    let data: Record<string, unknown> = {}
    if (isGopalji) {
      submission_type = 'readiness_gopalji'
      data = { tranzact_inward_ready: inwardReady, tranzact_outward_ready: outwardReady }
    } else if (isAltab) {
      submission_type = 'readiness_altab'
      data = { sheet_outward_ready: sheetReady }
    } else if (isFurkan) {
      submission_type = 'readiness_furkan'
      data = {
        tranzact_verified: tranzactVerified,
        closing_sellable: Number(sellable),
        closing_unassembled: Number(unassembled),
        closing_defective: Number(defective),
        closing_discontinued: Number(discontinued),
      }
    }
    try {
      const res = await fetch(`/api/v1/cycles/${cycleId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submission_type, data }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Kuch gadbad ho gayi. Dobara try karo.')
        return
      }
      setSubmitted(true)
      setSubmittedData(data)
      setSubmittedAt(new Date().toISOString())
    } catch {
      setError('Internet nahi hai. Thodi der baad try karo.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted && submittedData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ho gaya!</h2>
        <p className="text-gray-500 text-center mb-2">Aapka data mil gaya.</p>
        {submittedAt && (
          <p className="text-gray-400 text-sm mb-6">{new Date(submittedAt).toLocaleString('hi-IN')}</p>
        )}
        <button
          onClick={() => router.push('/home')}
          className="w-full max-w-xs h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl"
        >
          Home par Jao
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-blue-700 text-white px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">
          {isAltab ? 'Sheet Ready Hai?' : 'Data Ready Hai?'}
        </h1>
        <p className="text-blue-200 text-sm mt-1">
          {isAltab ? 'Google Sheet' : 'Tranzact'}
        </p>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {isGopalji && (
          <>
            <label className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <input type="checkbox" checked={inwardReady} onChange={(e) => setInwardReady(e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0" />
              <span className="text-gray-800">Inward entries update ho gayi hain</span>
            </label>
            <label className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <input type="checkbox" checked={outwardReady} onChange={(e) => setOutwardReady(e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0" />
              <span className="text-gray-800">Outward entries update ho gayi hain</span>
            </label>
          </>
        )}

        {isAltab && (
          <label className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <input type="checkbox" checked={sheetReady} onChange={(e) => setSheetReady(e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0" />
            <span className="text-gray-800">Sheet outward entries update ho gayi hain</span>
          </label>
        )}

        {isFurkan && (
          <>
            <label className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <input type="checkbox" checked={tranzactVerified} onChange={(e) => setTranzactVerified(e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0" />
              <span className="text-gray-800">Tranzact data verify ho gaya hai</span>
            </label>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              <p className="font-medium text-gray-700 text-sm">Tranzact Closing Stock (Okhla Factory)</p>
              {[['Sellable', sellable, setSellable], ['Unassembled', unassembled, setUnassembled], ['Defective', defective, setDefective], ['Discontinued', discontinued, setDiscontinued]].map(([label, val, setVal]) => (
                <div key={label as string}>
                  <label className="block text-sm text-gray-600 mb-1">{label as string}</label>
                  <input
                    type="number"
                    min={0}
                    value={val as string}
                    onChange={(e) => (setVal as (v: string) => void)(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-40 active:bg-blue-800"
        >
          {loading ? 'Submit ho raha hai...' : 'Confirm — Data Ready Hai'}
        </button>
      </div>
    </div>
  )
}
