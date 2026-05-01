'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Task { task_name: string; status: string; updated_at: string; notes: string }

export default function ChecklistPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [allCleared, setAllCleared] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }

    async function load() {
      const cycleRes = await fetch('/api/v1/cycles/active', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()).catch(() => null)

      if (cycleRes?.cycle) {
        const taskRes = await fetch(`/api/v1/cycles/${cycleRes.cycle.id}/clearance/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => null)
        if (taskRes) {
          setTasks(taskRes.tasks ?? [])
          setAllCleared(taskRes.all_cleared ?? false)
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>
  }

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <div className="bg-blue-700 text-white px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">Mera Status</h1>
        <p className="text-blue-200 text-sm mt-1">Is mahine ke saare kaam</p>
      </div>

      <div className="flex-1 px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {tasks.length === 0 ? (
            <div className="px-4 py-6 text-gray-400 text-sm text-center">
              Koi kaam assign nahi hua abhi.
            </div>
          ) : (
            tasks.map((task, i) => (
              <div key={i} className="flex items-center px-4 py-4 border-b border-gray-50 last:border-0">
                <span className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${task.status === 'cleared' ? 'bg-green-500' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{task.task_name}</div>
                  {task.notes && <div className="text-xs text-gray-400 mt-0.5 truncate">{task.notes}</div>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0 ${task.status === 'cleared' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {task.status === 'cleared' ? 'Ho gaya' : 'Baaki hai'}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${allCleared ? 'bg-green-500' : 'bg-amber-400'}`} />
          <span className="text-sm text-gray-600">
            {allCleared
              ? 'Is mahine sab clear hai. Puri tarah clear hone par full release.'
              : 'Clearance pending — baaki kaam complete karo.'}
          </span>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex">
        <Link href="/home" className="flex-1 flex flex-col items-center justify-center py-3 text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link href="/checklist" className="flex-1 flex flex-col items-center justify-center py-3 text-blue-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xs mt-1">Mera Status</span>
        </Link>
      </div>
    </div>
  )
}
