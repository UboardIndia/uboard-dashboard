'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TaskRow { task_name: string; status: string; notes: string; updated_at: string }
interface SalaryRow { user_id: string; name: string; tasks: TaskRow[]; all_cleared: boolean; release_status: string }

export default function SalaryReportPage() {
  const router = useRouter()
  const [cycle, setCycle] = useState<{ id: string; cycle_month: string } | null>(null)
  const [salaryData, setSalaryData] = useState<SalaryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token) { router.replace('/login'); return }
    if (role !== 'admin') { router.replace('/dashboard'); return }

    async function load() {
      const cycleRes = await fetch('/api/v1/cycles/active', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => null)
      if (cycleRes?.cycle) {
        setCycle(cycleRes.cycle)
        const salRes = await fetch(`/api/v1/admin/salary-report/${cycleRes.cycle.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => null)
        setSalaryData(salRes?.salaryData ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleExport() {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/v1/admin/salary-report/${cycle!.id}?export=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `uboard-salary-${cycle!.cycle_month}.xlsx`; a.click()
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salary Report</h1>
          <p className="text-yellow-700 text-sm font-medium mt-1 bg-yellow-50 px-3 py-1 rounded-lg inline-block">CONFIDENTIAL — Admin only</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium">Export Salary Report</button>
      </div>

      <div className="space-y-4">
        {salaryData.map((person) => (
          <div key={person.user_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-800">{person.name}</span>
              <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${person.release_status === 'Full Release' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {person.release_status}
              </span>
            </div>
            {person.tasks.map((task) => (
              <div key={task.task_name} className="flex items-center px-6 py-3 border-b border-gray-50 last:border-0">
                <span className={`w-2 h-2 rounded-full mr-3 ${task.status === 'cleared' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="flex-1 text-sm text-gray-700">{task.task_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'cleared' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {task.status}
                </span>
                {task.notes && <span className="text-xs text-gray-400 ml-3 max-w-xs truncate">{task.notes}</span>}
              </div>
            ))}
          </div>
        ))}
        {salaryData.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">No clearance data for this cycle yet.</div>
        )}
      </div>
    </div>
  )
}
