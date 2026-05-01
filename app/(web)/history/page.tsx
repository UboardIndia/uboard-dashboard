'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Cycle { id: string; cycle_month: string; status: string; signed_off_at: string }

export default function HistoryPage() {
  const router = useRouter()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }
    fetch('/api/v1/cycles/active', { headers: { Authorization: `Bearer ${token}` } })
      .then(async () => {
        // We use the admin cycles endpoint but fall back gracefully
        const all = await fetch('/api/v1/admin/cycles', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json()).catch(() => null)
        setCycles(all?.cycles ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cycle History</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {cycles.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">No completed cycles yet.</div>
        ) : (
          cycles.map((cycle) => (
            <div key={cycle.id} className="flex items-center px-6 py-4 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{cycle.cycle_month}</div>
                {cycle.signed_off_at && (
                  <div className="text-xs text-gray-400">Signed off: {new Date(cycle.signed_off_at).toLocaleDateString()}</div>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium mr-4 ${
                cycle.status === 'signed_off' ? 'bg-green-100 text-green-700' :
                cycle.status === 'frozen' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {cycle.status}
              </span>
              <Link href={`/report?cycleId=${cycle.id}`} className="text-sm text-blue-700 hover:underline">View</Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
