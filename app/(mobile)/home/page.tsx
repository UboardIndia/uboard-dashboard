'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Cycle { id: string; cycle_month: string; status: string }
interface Task { task_name: string; status: string; deadline?: string }

function getDaysUntil(cycleMonth: string) {
  const [y, m] = cycleMonth.split('-').map(Number)
  const cutoff = new Date(y, m - 1, 28, 23, 59, 59)
  const now = new Date()
  const diff = Math.ceil((cutoff.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function isLastDayOfMonth() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  return tomorrow.getMonth() !== now.getMonth()
}

export default function HomePage() {
  const router = useRouter()
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [allCleared, setAllCleared] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userName = localStorage.getItem('userName') ?? ''
    setName(userName)
    if (!token) { router.replace('/login'); return }

    async function load() {
      const cycleRes = await fetch('/api/v1/cycles/active', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()).catch(() => null)

      if (cycleRes?.cycle) {
        const c = cycleRes.cycle
        setCycle(c)
        const taskRes = await fetch(`/api/v1/cycles/${c.id}/clearance/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => null)
        if (taskRes) {
          setTasks(taskRes.tasks ?? [])
          setAllCleared(taskRes.all_cleared ?? false)
          setPendingCount((taskRes.tasks ?? []).filter((t: Task) => t.status !== 'cleared').length)
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const daysLeft = cycle ? getDaysUntil(cycle.cycle_month) : 0
  const showChalllanReminder = isLastDayOfMonth()

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 pt-10 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm">Stock System</p>
            <h1 className="text-2xl font-bold mt-1">Namaskar, {name}!</h1>
          </div>
          <button
            onClick={async () => {
              const token = localStorage.getItem('token')
              await fetch('/api/v1/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
              localStorage.clear()
              router.replace('/login')
            }}
            className="mt-1 text-blue-200 text-xs border border-blue-400 rounded-lg px-3 py-1.5 hover:bg-blue-600 active:bg-blue-800"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Cycle card */}
        {cycle && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="font-semibold text-gray-800 text-lg">
              {cycle.cycle_month} Reconciliation
            </div>
            {daysLeft > 0 ? (
              <div className="text-gray-500 text-sm mt-1">
                {daysLeft} din baaki — 28 tarikh deadline
              </div>
            ) : (
              <div className="text-red-600 text-sm font-medium mt-1">Aaj deadline hai!</div>
            )}
          </div>
        )}

        {/* Challan reminder — last day of month only */}
        {showChalllanReminder && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-amber-800 text-sm font-medium">
              Aaj ke saare challan aaj hi update karo Tranzact mein.
            </p>
          </div>
        )}

        {/* Task list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-700">Is mahine ke kaam</span>
          </div>
          {tasks.length === 0 ? (
            <div className="px-4 py-4 text-gray-400 text-sm">Koi kaam assign nahi hua abhi.</div>
          ) : (
            tasks.map((task, i) => (
              <div key={i} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
                <span
                  className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                    task.status === 'cleared'
                      ? 'bg-green-500'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="flex-1 text-sm text-gray-700">{task.task_name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    task.status === 'cleared'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {task.status === 'cleared' ? 'Ho gaya' : 'Baaki hai'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Clearance indicator */}
        <div className="flex items-center gap-2 px-1 pt-2">
          <span
            className={`w-3 h-3 rounded-full flex-shrink-0 ${allCleared ? 'bg-green-500' : 'bg-amber-400'}`}
          />
          <span className="text-sm text-gray-600">
            {allCleared
              ? 'Is mahine sab clear hai'
              : pendingCount === 1
              ? 'Ek kaam baaki hai is mahine'
              : `${pendingCount} kaam baaki hain is mahine`}
          </span>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex">
        <Link
          href="/home"
          className="flex-1 flex flex-col items-center justify-center py-3 text-blue-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          href="/checklist"
          className="flex-1 flex flex-col items-center justify-center py-3 text-gray-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xs mt-1">Mera Status</span>
        </Link>
      </div>
    </div>
  )
}
