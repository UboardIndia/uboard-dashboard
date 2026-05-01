import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { ClearanceStatus, Users, Cycles } from '@/lib/sheets'
import { isAdmin, canViewSalaryReport } from '@/lib/roles'
import { generateSalaryReportXlsx } from '@/lib/export'

export async function GET(req: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !canViewSalaryReport(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const exportXlsx = searchParams.get('export') === 'true'

  const allTasks = await ClearanceStatus.byCycleId(cycleId)
  const allUsers = await Users.all()
  const cycleResult = await Cycles.byId(cycleId)

  const byUser: Record<string, { name: string; tasks: typeof allTasks }> = {}
  for (const entry of allTasks) {
    const { user_id } = entry.row
    if (!byUser[user_id]) {
      const u = allUsers.find((u) => u.id === user_id)
      byUser[user_id] = { name: u?.name ?? 'Unknown', tasks: [] }
    }
    byUser[user_id].tasks.push(entry)
  }

  const salaryData = Object.entries(byUser).map(([userId, { name, tasks }]) => {
    const all_cleared = tasks.every((t) => t.row.status === 'cleared')
    return {
      user_id: userId,
      name,
      tasks: tasks.map((t) => ({
        task_name: t.row.task_name,
        status: t.row.status,
        notes: t.row.notes,
        updated_at: t.row.updated_at,
      })),
      all_cleared,
      // ONLY this endpoint returns Hold/Release language
      release_status: all_cleared ? 'Full Release' : 'Hold',
    }
  })

  if (exportXlsx && cycleResult) {
    const buffer = generateSalaryReportXlsx(cycleResult.row.cycle_month, salaryData)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="uboard-salary-${cycleResult.row.cycle_month}.xlsx"`,
      },
    })
  }

  return NextResponse.json({ salaryData })
}
