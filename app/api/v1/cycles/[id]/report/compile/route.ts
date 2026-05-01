import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Cycles, ReconciliationReports } from '@/lib/sheets'
import { canCompileReport } from '@/lib/roles'
import { getSubmissionsForCycle, getMissingSubmissions } from '@/lib/cycle'
import { compileReport } from '@/lib/report'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !canCompileReport(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cycleResult = await Cycles.byId(id)
  if (!cycleResult) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })

  const submissions = await getSubmissionsForCycle(id)
  const missing = getMissingSubmissions(submissions)
  if (missing.length > 0) {
    return NextResponse.json({ error: 'Missing submissions', missing }, { status: 422 })
  }

  const body = await req.json().catch(() => ({}))
  const report = compileReport(
    submissions,
    Number(body.opening_stock ?? 0),
    Number(body.total_inward ?? 0),
    Number(body.returnable_out ?? 0),
    Number(body.returned ?? 0)
  )
  report.compiled_by = payload.userId

  const existing = await ReconciliationReports.byCycleId(id)
  if (existing) {
    await ReconciliationReports.update(existing.rowIndex, {
      id: existing.row.id,
      cycle_id: id,
      opening_stock: String(report.opening_stock),
      total_inward: String(report.total_inward),
      total_outward: String(report.total_outward),
      sellable: String(report.sellable),
      defective: String(report.defective),
      unassembled: String(report.unassembled),
      discontinued: String(report.discontinued),
      dispatched: String(report.dispatched),
      returns_in_transit: String(report.returns_in_transit),
      returned: String(report.returned),
      returnable_out: String(report.returnable_out),
      leakage: String(report.leakage),
      compiled_at: report.compiled_at,
      compiled_by: report.compiled_by,
    })
  } else {
    await ReconciliationReports.append({
      id: crypto.randomUUID(),
      cycle_id: id,
      opening_stock: String(report.opening_stock),
      total_inward: String(report.total_inward),
      total_outward: String(report.total_outward),
      sellable: String(report.sellable),
      defective: String(report.defective),
      unassembled: String(report.unassembled),
      discontinued: String(report.discontinued),
      dispatched: String(report.dispatched),
      returns_in_transit: String(report.returns_in_transit),
      returned: String(report.returned),
      returnable_out: String(report.returnable_out),
      leakage: String(report.leakage),
      compiled_at: report.compiled_at,
      compiled_by: report.compiled_by,
    })
  }

  return NextResponse.json({ report })
}
