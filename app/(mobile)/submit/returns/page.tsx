'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReturnsPage() {
  const router = useRouter()
  const [cycleId, setCycleId] = useState('')
  const [amazon, setAmazon] = useState('')
  const [flipkart, setFlipkart] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedAt, setSubmittedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const name = localStorage.getItem('userName')
    if (!token) { router.replace('/login'); return }
    if (name !== 'Arti') { router.replace('/home'); return }

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
        const existing = d?.submissions?.find((s: { submission_type: string }) => s.submission_type === 'returns_arti')
        if (existing) { setSubmitted(true); setSubmittedAt(existing.submitted_at) }
      })
      .catch(() => {})
  }, [router])

  async function handleSubmit() {
    setError('')
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/v1/cycles/${cycleId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          submission_type: 'returns_arti',
          data: { amazon_initiated: Number(amazon) || 0, flipkart_initiated: Number(flipkart) || 0 },
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
        <p className="text-gray-500 mb-2">Aapka data mil gaya.</p>
        {submittedAt && <p className="text-gray-400 text-sm mb-6">{new Date(submittedAt).toLocaleString('hi-IN')}</p>}
        <button onClick={() => router.push('/home')} className="w-full max-w-xs h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl">Home par Jao</button>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('hi-IN')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-blue-700 text-white px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">Returns In Transit</h1>
        <p className="text-blue-200 text-sm mt-1">{today}</p>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amazon pe initiated returns</label>
            <input type="number" min={0} value={amazon} onChange={(e) => setAmazon(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Flipkart pe initiated returns</label>
            <input type="number" min={0} value={flipkart} onChange={(e) => setFlipkart(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleSubmit}
          disabled={loading || !cycleId}
          className="w-full h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-40 active:bg-blue-800"
        >
          {loading ? 'Submit ho raha hai...' : 'Submit Karo'}
        </button>
      </div>
    </div>
  )
}
