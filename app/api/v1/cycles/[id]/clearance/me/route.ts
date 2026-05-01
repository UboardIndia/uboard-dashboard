import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { ClearanceStatus } from '@/lib/sheets'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const all = await ClearanceStatus.byCycleId(id)
  const mine = all.filter((r) => r.row.user_id === payload.userId)

  const tasks = mine.map((r) => ({
    task_name: r.row.task_name,
    status: r.row.status,
    updated_at: r.row.updated_at,
    notes: r.row.notes,
  }))

  const all_cleared = tasks.length > 0 && tasks.every((t) => t.status === 'cleared')

  // NEVER return salary amounts — task-level status only
  return NextResponse.json({ tasks, all_cleared })
}
