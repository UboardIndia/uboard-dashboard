import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { ReconciliationReports, Submissions } from '@/lib/sheets'
import { canReadAllSubmissions } from '@/lib/roles'
import { threeWayComparison } from '@/lib/report'
import type { ReadinessFurkan, PhysicalCountArjun } from '@/types/api'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !canReadAllSubmissions(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const reportResult = await ReconciliationReports.byCycleId(id)
  if (!reportResult) return NextResponse.json({ error: 'Report not yet compiled' }, { status: 404 })

  const allSubs = await Submissions.byCycleId(id)
  const furkanSub = allSubs.find((r) => r.row.submission_type === 'readiness_furkan')
  const arjunSub = allSubs.find((r) => r.row.submission_type === 'physical_count_arjun')

  let threeWay = null
  if (furkanSub && arjunSub) {
    const furkan: ReadinessFurkan = JSON.parse(furkanSub.row.data_json)
    const arjun: PhysicalCountArjun = JSON.parse(arjunSub.row.data_json)
    threeWay = threeWayComparison(furkan, arjun)
  }

  return NextResponse.json({ report: reportResult.row, threeWay })
}
