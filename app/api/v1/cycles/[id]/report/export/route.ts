import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { ReconciliationReports, Submissions, Cycles } from '@/lib/sheets'
import { canReadAllSubmissions } from '@/lib/roles'
import { generateReportXlsx } from '@/lib/export'
import { threeWayComparison } from '@/lib/report'
import type { ReadinessFurkan, PhysicalCountArjun, ReportData } from '@/types/api'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !canReadAllSubmissions(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cycleResult = await Cycles.byId(id)
  const reportResult = await ReconciliationReports.byCycleId(id)
  if (!reportResult || !cycleResult) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const allSubs = await Submissions.byCycleId(id)
  const subs = allSubs.map((r) => r.row)

  const furkanSub = allSubs.find((r) => r.row.submission_type === 'readiness_furkan')
  const arjunSub = allSubs.find((r) => r.row.submission_type === 'physical_count_arjun')

  const furkan: ReadinessFurkan = furkanSub
    ? JSON.parse(furkanSub.row.data_json)
    : { closing_sellable: 0, closing_unassembled: 0, closing_defective: 0, closing_discontinued: 0, tranzact_verified: false }

  const arjun: PhysicalCountArjun = arjunSub
    ? JSON.parse(arjunSub.row.data_json)
    : { products: [], totals: { unassembled: 0, sellable: 0, defective: 0, discontinued: 0 } }

  const r = reportResult.row
  const report: ReportData = {
    opening_stock: Number(r.opening_stock),
    total_inward: Number(r.total_inward),
    total_outward: Number(r.total_outward),
    sellable: Number(r.sellable),
    defective: Number(r.defective),
    unassembled: Number(r.unassembled),
    discontinued: Number(r.discontinued),
    dispatched: Number(r.dispatched),
    returns_in_transit: Number(r.returns_in_transit),
    returned: Number(r.returned),
    returnable_out: Number(r.returnable_out),
    leakage: Number(r.leakage),
    compiled_at: r.compiled_at,
    compiled_by: r.compiled_by,
  }

  const buffer = generateReportXlsx(
    cycleResult.row.cycle_month,
    report,
    threeWayComparison(furkan, arjun),
    subs
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="uboard-report-${cycleResult.row.cycle_month}.xlsx"`,
    },
  })
}
