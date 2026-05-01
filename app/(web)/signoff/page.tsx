'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Task { task_name: string; status: string }
interface UserClearance { user_id: string; name: string; tasks: Task[]; all_cleared: boolean }

export default function SignoffPage() {
  const router = useRouter()
  const [cycle, setCycle] = useState<{ id: string; cycle_month: string; status: string } | null>(null)
  const [clearance, setClearance] = useState<UserClearance[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [signing, setSigning] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [escalateNote, setEscalateNote] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token) { router.replace('/login'); return }
    if (role !== 'supervisor') { router.replace('/dashboard'); return }

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

  async function handleSignoff() {
    setSigning(true)
    const token = localStorage.getItem('token')
    await fetch(`/api/v1/cycles/${cycle!.id}/signoff`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    setSigning(false)
    setConfirming(false)
    setDone(true)
  }

  async function handleEscalate() {
    const token = localStorage.getItem('token')
    await fetch(`/api/v1/cycles/${cycle!.id}/escalate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: escalateNote }),
    })
    setEscalating(false)
    setEscalateNote('')
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  if (done) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800">Cycle signed off.</h2>
      <p className="text-gray-500 mt-2">All data for {cycle?.cycle_month} is now permanently locked.</p>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Sign-off</h1>
      <p className="text-gray-500 mb-6">Review and sign off {cycle?.cycle_month}</p>

      {/* Clearance summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-700">Clearance Status</div>
        {clearance.map((person) => (
          <div key={person.user_id} className="flex items-center px-6 py-4 border-b border-gray-50 last:border-0">
            <span className={`w-2.5 h-2.5 rounded-full mr-3 ${person.all_cleared ? 'bg-green-500' : 'bg-amber-400'}`} />
            <span className="flex-1 font-medium text-gray-700">{person.name}</span>
            <span className={`text-sm px-3 py-1 rounded-full ${person.all_cleared ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {person.all_cleared ? 'All clear' : 'Pending'}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {!confirming && !escalating && (
          <>
            <button
              onClick={() => setConfirming(true)}
              className="px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800"
            >
              Sign off cycle
            </button>
            <button
              onClick={() => setEscalating(true)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              Escalate to Admin
            </button>
          </>
        )}
      </div>

      {/* Sign-off confirmation */}
      {confirming && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">Confirm Sign-off</h3>
          <p className="text-amber-700 text-sm mb-4">
            This will lock all data for {cycle?.cycle_month}. This cannot be undone. Confirm?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirming(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 text-sm">Cancel</button>
            <button onClick={handleSignoff} disabled={signing} className="px-4 py-2 bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
              {signing ? 'Signing off...' : 'Confirm Sign-off'}
            </button>
          </div>
        </div>
      )}

      {/* Escalate form */}
      {escalating && (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Escalate to Admin</h3>
          <textarea value={escalateNote} onChange={(e) => setEscalateNote(e.target.value)} rows={3}
            placeholder="Describe the issue..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
          <div className="flex gap-3">
            <button onClick={() => setEscalating(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 text-sm">Cancel</button>
            <button onClick={handleEscalate} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm">Send Escalation</button>
          </div>
        </div>
      )}
    </div>
  )
}
