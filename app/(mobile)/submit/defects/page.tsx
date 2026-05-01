'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const EV_PRODUCTS = ['U-Board E1', 'U-Board E2', 'U-Board Pro', 'U-Board Lite', 'U-Board Max']

interface DefectItem { product: string; qty: number; type: 'A' | 'B'; part_name: string }

export default function DefectsPage() {
  const router = useRouter()
  const [cycleId, setCycleId] = useState('')
  const [items, setItems] = useState<DefectItem[]>([{ product: EV_PRODUCTS[0], qty: 1, type: 'A', part_name: '' }])
  const [submitted, setSubmitted] = useState(false)
  const [submittedAt, setSubmittedAt] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const name = localStorage.getItem('userName')
    if (!token) { router.replace('/login'); return }
    if (name !== 'Kashif') { router.replace('/home'); return }

    fetch('/api/v1/cycles/active', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.cycle) {
          setCycleId(d.cycle.id)
          return fetch(`/api/v1/cycles/${d.cycle.id}/submissions/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
        }
      })
      .then((d) => {
        const existing = d?.submissions?.find((s: { submission_type: string }) => s.submission_type === 'defects_kashif')
        if (existing) { setSubmitted(true); setSubmittedAt(existing.submitted_at) }
      })
      .catch(() => {})
  }, [router])

  function updateItem(i: number, field: keyof DefectItem, value: string | number) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems((prev) => [...prev, { product: EV_PRODUCTS[0], qty: 1, type: 'A', part_name: '' }])
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const canSubmit = items.every((item) => item.part_name.trim() !== '' && item.qty > 0)
  const totalUnits = items.reduce((sum, i) => sum + i.qty, 0)

  async function handleSubmit() {
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/v1/cycles/${cycleId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submission_type: 'defects_kashif', data: { items } }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Kuch gadbad ho gayi.')
        return
      }
      setSubmitted(true); setSubmittedAt(new Date().toISOString()); setConfirming(false)
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
        <p className="text-gray-500 text-center mb-2">Aapka data mil gaya.</p>
        {submittedAt && <p className="text-gray-400 text-sm mb-6">{new Date(submittedAt).toLocaleString('hi-IN')}</p>}
        <button onClick={() => router.push('/home')} className="w-full max-w-xs h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl">Home par Jao</button>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="bg-white rounded-2xl p-6 shadow max-w-sm w-full">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Confirm karo</h2>
          <p className="text-gray-600 mb-4">{totalUnits} units submit ho rahe hain. Confirm karo.</p>
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
          <div className="flex gap-3">
            <button onClick={() => setConfirming(false)} className="flex-1 h-12 border border-gray-300 rounded-xl text-gray-700 font-medium">Wapas jao</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 h-12 bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-60">
              {loading ? 'Submit...' : 'Submit Karo'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-blue-700 text-white px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">Defective Units</h1>
        <p className="text-blue-200 text-sm mt-1">Submit Karo</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 text-sm">Unit #{i + 1}</span>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} className="text-red-400 text-xs">Hatao</button>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Product</label>
              <select value={item.product} onChange={(e) => updateItem(i, 'product', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {EV_PRODUCTS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kitne units?</label>
              <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(i, 'qty', Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <div className="flex gap-2">
                {(['A', 'B'] as const).map((t) => (
                  <button key={t} onClick={() => updateItem(i, 'type', t)}
                    className={`flex-1 h-12 rounded-xl font-medium text-sm border ${item.type === t ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300'}`}>
                    {t === 'A' ? 'Type A — Kharab' : 'Type B — Missing'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {item.type === 'A' ? 'Kaunsa part kharab hai?' : 'Kaunsa part missing hai?'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input type="text" value={item.part_name} onChange={(e) => updateItem(i, 'part_name', e.target.value)}
                placeholder={item.type === 'A' ? 'jaise: motor kharab, battery dead' : 'jaise: controller missing'}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        ))}

        <button onClick={addItem} className="w-full h-12 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium text-sm">
          + Aur add karo
        </button>
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={() => setConfirming(true)}
          disabled={!canSubmit || !cycleId}
          className="w-full h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-40 active:bg-blue-800"
        >
          Submit Karo
        </button>
      </div>
    </div>
  )
}
