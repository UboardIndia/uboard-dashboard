'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Task { task_name: string; status: string; notes: string; updated_at: string }
interface UserClearance { user_id: string; name: string; tasks: Task[]; all_cleared: boolean }

export default function ClearancePage() {
  const router = useRouter()
  const [cycle, setCycle] = useState<{ id: string; cycle_month: string } | null>(null)
  const [clearance, setClearance] = useState<UserClearance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token) { router.replace('/login'); return }
    if (role !== 'reconciler') { router.replace('/dashboard'); return }

    async function load() {
      const cycleRes = await fetch('/api/v1/cycles/active', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => null)
      if (cycleRes?.cycle) {
        setCycle(cycleRes.cycle)
        const clRes = await fetch(`/api/v1/cycles/${cycleRes.cycle.id}/clearance`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => null)
        setClearance(clRes?.clearance ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function toggleTask(userId: string, taskName: string, currentStatus: string) {
    const token = localStorage.getItem('token')
    const newStatus = currentStatus === 'cleared' ? 'pending' : 'cleared'
    setSaving(`${userId}-${taskName}`)
    await fetch(`/api/v1/cycles/${cycle!.id}/clearance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, task_name: taskName, status: newStatus }),
    })
    // Refresh
    const clRes = await fetch(`/api/v1/cycles/${cycle!.id}/clearance`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).catch(() => null)
    setClearance(clRes?.clearance ?? [])
    setSaving(null)
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Clearance</h1>
      <p className="text-gray-500 mb-6">Mark tasks cleared or pending — {cycle?.cycle_month}</p>

      <div className="space-y-4">
        {clearance.map((person) => (
          <div key={person.user_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${person.all_cleared ? 'bg-green-500' : 'bg-amber-400'}`} />
                <span className="font-semibold text-gray-800">{person.name}</span>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${person.all_cleared ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {person.all_cleared ? 'Full release' : 'Clearance pending'}
              </span>
            </div>
            {person.tasks.map((task) => (
              <div key={task.task_name} className="flex items-center px-6 py-3 border-b border-gray-50 last:border-0">
                <span className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${task.status === 'cleared' ? 'bg-green-500' : 'bg-amber-400'}`} />
                <span className="flex-1 text-sm text-gray-700">{task.task_name}</span>
                <button
                  onClick={() => toggleTask(person.user_id, task.task_name, task.status)}
                  disabled={saving === `${person.user_id}-${task.task_name}`}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    task.status === 'cleared'
                      ? 'bg-green-100 text-green-700 hover:bg-amber-100 hover:text-amber-700'
                      : 'bg-amber-100 text-amber-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  {saving === `${person.user_id}-${task.task_name}` ? '...' : task.status === 'cleared' ? 'Cleared' : 'Pending'}
                </button>
              </div>
            ))}
          </div>
        ))}
        {clearance.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">No clearance data yet for this cycle.</div>
        )}
      </div>
    </div>
  )
}
