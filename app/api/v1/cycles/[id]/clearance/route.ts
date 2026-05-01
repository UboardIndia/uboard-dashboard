import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { ClearanceStatus, Users } from '@/lib/sheets'
import { canMarkClearance, isAdmin } from '@/lib/roles'
import { ClearanceUpdateSchema } from '@/lib/validators'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canMarkClearance(payload.role) && !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tasks = await ClearanceStatus.byCycleId(id)
  const allUsers = await Users.all()

  // Group by user, compute all_cleared per person
  const byUser: Record<string, { name: string; tasks: typeof tasks }> = {}
  for (const { row } of tasks) {
    if (!byUser[row.user_id]) {
      const u = allUsers.find((u) => u.id === row.user_id)
      byUser[row.user_id] = { name: u?.name ?? 'Unknown', tasks: [] }
    }
    byUser[row.user_id].tasks.push({ row, rowIndex: 0 })
  }

  const result = Object.entries(byUser).map(([userId, { name, tasks: userTasks }]) => ({
    user_id: userId,
    name,
    tasks: userTasks.map((t) => ({
      task_name: t.row.task_name,
      status: t.row.status,
      updated_at: t.row.updated_at,
      notes: t.row.notes,
    })),
    all_cleared: userTasks.every((t) => t.row.status === 'cleared'),
  }))

  return NextResponse.json({ clearance: result })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !canMarkClearance(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = ClearanceUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { user_id, task_name, status, notes } = parsed.data

  const all = await ClearanceStatus.byCycleId(id)
  const existing = all.find(
    (r) => r.row.user_id === user_id && r.row.task_name === task_name
  )

  const now = new Date().toISOString()
  if (existing) {
    await ClearanceStatus.update(existing.rowIndex, {
      ...existing.row,
      status,
      notes: notes ?? '',
      updated_by: payload.userId,
      updated_at: now,
    })
  } else {
    await ClearanceStatus.append({
      id: crypto.randomUUID(),
      cycle_id: id,
      user_id,
      task_name,
      status,
      updated_by: payload.userId,
      updated_at: now,
      notes: notes ?? '',
    })
  }

  return NextResponse.json({ success: true })
}
