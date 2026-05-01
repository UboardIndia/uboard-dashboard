'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReportRow { category: string; tranzact: number; physical: number; match: boolean }
interface Report {
  opening_stock: string; total_inward: string; sellable: string; defective: string
  unassembled: string; discontinued: string; dispatched: string; returns_in_transit: string
  returned: string; returnable_out: string; leakage: string; cycle_id: string; compiled_at: string
}

export default function ReportPage() {
  const router = useRouter()
  const [cycle, setCycle] = useState<{ id: string; cycle_month: string } | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [threeWay, setThreeWay] = useState<ReportRow[]>([])
  const [role, setRole] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const r = localStorage.getItem('role') ?? ''
    setRole(r)
    if (!token) { router.replace('/login'); return }

    async function load() {
      const cycleRes = await fetch('/api/v1/cycles/active', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => null)
      if (cycleRes?.cycle) {
        setCycle(cycleRes.cycle)
        const rRes = await fetch(`/api/v1/cycles/${cycleRes.cycle.id}/report`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => null)
        if (rRes?.report) { setReport(rRes.report); setThreeWay(rRes.threeWay ?? []) }
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleExport() {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/v1/cycles/${cycle!.id}/report/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `uboard-report-${cycle!.cycle_month}.xlsx`; a.click()
  }

  if (loading) return <div className="text-gray-400">Loading...</div>
  if (!report) return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Report</h1>
      <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
        Report not yet compiled. Go to Dashboard and click &quot;Compile Report&quot; when all submissions are in.
      </div>
    </div>
  )

  const leakage = Number(report.leakage)
  const hasLeakage = leakage !== 0
  const hasMismatch = threeWay.some((r) => !r.match)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reconciliation Report</h1>
          <p className="text-gray-500 text-sm">Okhla Factory — {cycle?.cycle_month}</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800">
          Export as Excel
        </button>
      </div>

      {hasLeakage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 font-medium">
          Leakage detected: {leakage} units. Investigation required.
        </div>
      )}

      {hasMismatch && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-4 text-sm">
          Mismatch between Tranzact and Physical count detected.
          <strong className="block mt-1">Physical count is source of truth. Tranzact should be corrected to match physical.</strong>
        </div>
      )}

      {/* Three-way table */}
      {threeWay.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-700">Three-Way Verification</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-500 font-medium">Category</th>
                <th className="px-6 py-3 text-right text-gray-500 font-medium">Tranzact</th>
                <th className="px-6 py-3 text-right text-gray-500 font-medium">Physical</th>
                <th className="px-6 py-3 text-center text-gray-500 font-medium">Match</th>
              </tr>
            </thead>
            <tbody>
              {threeWay.map((row) => (
                <tr key={row.category} className={`border-t border-gray-50 ${!row.match ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-3 text-gray-700">{row.category}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{row.tranzact}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-800">{row.physical}</td>
                  <td className="px-6 py-3 text-center">
                    {row.match ? (
                      <span className="text-green-600 font-medium">✓ Match</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ Mismatch</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Core equation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-700">Core Equation</div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
          {[
            ['Opening Stock', report.opening_stock],
            ['Total Inward', report.total_inward],
            ['Sellable (Physical)', report.sellable],
            ['Unassembled (Physical)', report.unassembled],
            ['Defective (Physical)', report.defective],
            ['Discontinued (Physical)', report.discontinued],
            ['Dispatched', report.dispatched],
            ['Returnable Out', report.returnable_out],
            ['Returns In Transit', report.returns_in_transit],
            ['Returned', report.returned],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{val}</span>
            </div>
          ))}
        </div>
        <div className={`mx-6 mb-4 px-4 py-3 rounded-xl font-semibold ${hasLeakage ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          Leakage: {leakage} {hasLeakage ? '⚠ Non-zero — investigate' : '✓ Balanced'}
        </div>
      </div>

      {/* Arjun's notes */}
      {role === 'supervisor' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-3">Investigation Notes</h2>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add notes about mismatches..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="mt-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium">Save Note</button>
        </div>
      )}
    </div>
  )
}
