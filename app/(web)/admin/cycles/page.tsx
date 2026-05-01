'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Cycle { id: string; cycle_month: string; status: string; created_at: string; signed_off_at: string; frozen_at: string }

export default function AllCyclesPage() {
  const router = useRouter()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newMonth, setNewMonth] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadCycles() {
    const token = localStorage.getItem('token')
    // Use the sheets helper directly via an admin route
    const res = await fetch('/api/v1/admin/cycles', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).catch(() => null)
    setCycles(res?.cycles ?? [])
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token) { router.replace('/login'); return }
    if (role !== 'admin') { router.replace('/dashboard'); return }
    loadCycles().then(() => setLoading(false))
  }, [router])

  async function handleCreate() {
    setSaving(true)
    const token = localStorage.getItem('token')
    await fetch('/api/v1/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ cycle_month: newMonth }),
    })
    setSaving(false); setCreating(false); setNewMonth('')
    loadCycles()
  }

  async function handleFreeze(id: string) {
    const token = localStorage.getItem('token')
    await fetch(`/api/v1/cycles/${id}/freeze`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    loadCycles()
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Cycles</h1>
        <button onClick={() => setCreating(true)} className="px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium">+ New Cycle</button>
      </div>

      {creating && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">New Cycle</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Cycle Month (YYYY-MM)</label>
              <input value={newMonth} onChange={(e) => setNewMonth(e.target.value)} placeholder="2026-05"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setCreating(false)} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !newMonth} className="px-4 py-2.5 bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Month', 'Status', 'Created', 'Frozen', 'Signed Off', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cycles.map((cycle) => (
              <tr key={cycle.id} className="border-t border-gray-50">
                <td className="px-6 py-3 font-medium text-gray-800">{cycle.cycle_month}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cycle.status === 'signed_off' ? 'bg-green-100 text-green-700' :
                    cycle.status === 'frozen' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>{cycle.status}</span>
                </td>
                <td className="px-6 py-3 text-gray-400 text-xs">{cycle.created_at ? new Date(cycle.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3 text-gray-400 text-xs">{cycle.frozen_at ? new Date(cycle.frozen_at).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3 text-gray-400 text-xs">{cycle.signed_off_at ? new Date(cycle.signed_off_at).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3">
                  {cycle.status === 'active' && (
                    <button onClick={() => handleFreeze(cycle.id)} className="text-xs text-blue-700 hover:underline">Freeze</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
