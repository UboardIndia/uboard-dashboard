'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const EV_PRODUCTS = ['U-Board E1', 'U-Board E2', 'U-Board Pro', 'U-Board Lite', 'U-Board Max']

interface ProductCount { product: string; unassembled: number; sellable: number; defective: number; discontinued: number }

export default function CountPage() {
  const router = useRouter()
  const [cycleId, setCycleId] = useState('')
  const [cycleMonth, setCycleMonth] = useState('')
  const [counts, setCounts] = useState<ProductCount[]>(
    EV_PRODUCTS.map((p) => ({ product: p, unassembled: 0, sellable: 0, defective: 0, discontinued: 0 }))
  )
  const [submitted, setSubmitted] = useState(false)
  const [submittedAt, setSubmittedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const name = localStorage.getItem('userName')
    if (!token) { router.replace('/login'); return }
    const r = localStorage.getItem('role')
    if (name !== 'Arjun' && r !== 'admin') { router.replace('/home'); return }

    fetch('/api/v1/cycles/active', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.cycle) {
          setCycleId(d.cycle.id)
          setCycleMonth(d.cycle.cycle_month)
          return fetch(`/api/v1/cycles/${d.cycle.id}/submissions/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
        }
      })
      .then((d) => {
        const existing = d?.submissions?.find((s: { submission_type: string }) => s.submission_type === 'physical_count_arjun')
        if (existing) { setSubmitted(true); setSubmittedAt(existing.submitted_at) }
      })
      .catch(() => {})
  }, [router])

  function updateCount(i: number, field: keyof Omit<ProductCount, 'product'>, val: string) {
    setCounts((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: Number(val) || 0 } : c))
  }

  const totals = {
    unassembled: counts.reduce((s, c) => s + c.unassembled, 0),
    sellable: counts.reduce((s, c) => s + c.sellable, 0),
    defective: counts.reduce((s, c) => s + c.defective, 0),
    discontinued: counts.reduce((s, c) => s + c.discontinued, 0),
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/v1/cycles/${cycleId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          submission_type: 'physical_count_arjun',
          data: { products: counts, totals },
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Kuch gadbad ho gayi.')
        return
      }
      setSubmitted(true); setSubmittedAt(new Date().toISOString())
    } catch {
      setError('Internet nahi hai. Thodi der baad try karo.')
    } finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ho gaya!</h2>
        <p className="text-gray-500 text-center mb-2">Count lock ho gaya. Change nahi ho sakta.</p>
        {submittedAt && <p className="text-gray-400 text-sm mb-6">{new Date(submittedAt).toLocaleString('hi-IN')}</p>}
        <button onClick={() => router.push('/home')} className="w-full max-w-xs h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl">Home par Jao</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-blue-700 text-white px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold">Physical Count — {cycleMonth}</h1>
        <p className="text-blue-200 text-sm mt-1">Okhla Factory Only</p>
      </div>

      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
        <p className="text-amber-800 text-sm">Sirf Okhla factory ka stock count karo. Khayala aur GK ka stock mat ginao.</p>
        <p className="text-amber-700 text-xs mt-1">Bill wale aur bina bill wale dono count karo.</p>
      </div>

      {error && <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="flex-1 px-4 py-4 space-y-4 pb-40">
        {counts.map((item, i) => (
          <div key={item.product} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="font-semibold text-gray-800 mb-3">{item.product}</div>
            <div className="grid grid-cols-2 gap-3">
              {(['unassembled', 'sellable', 'defective', 'discontinued'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1 capitalize">{field}</label>
                  <input
                    type="number"
                    min={0}
                    value={item[field]}
                    onChange={(e) => updateCount(i, field, e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Totals row */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="font-semibold text-blue-800 mb-2">Grand Total</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Unassembled: <span className="font-bold text-gray-800">{totals.unassembled}</span></div>
            <div className="text-gray-600">Sellable: <span className="font-bold text-gray-800">{totals.sellable}</span></div>
            <div className="text-gray-600">Defective: <span className="font-bold text-gray-800">{totals.defective}</span></div>
            <div className="text-gray-600">Discontinued: <span className="font-bold text-gray-800">{totals.discontinued}</span></div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-4 py-4">
        <p className="text-xs text-amber-600 mb-2 text-center">Submit karne ke baad change nahi kar sakte</p>
        <button
          onClick={handleSubmit}
          disabled={loading || !cycleId}
          className="w-full h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-40 active:bg-blue-800"
        >
          {loading ? 'Submit ho raha hai...' : 'Submit Karo — Lock Ho Jayega'}
        </button>
      </div>
    </div>
  )
}
