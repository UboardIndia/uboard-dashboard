import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Cycles, Escalations, Notifications, Users } from '@/lib/sheets'
import { canSignOff } from '@/lib/roles'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !canSignOff(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cycleResult = await Cycles.byId(id)
  if (!cycleResult) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  await Escalations.append({
    id: crypto.randomUUID(),
    cycle_id: id,
    raised_by: payload.userId,
    raised_at: new Date().toISOString(),
    notes: body.notes ?? '',
    resolved_at: '',
    resolved_by: '',
  })

  // Notify all admins
  const allUsers = await Users.all()
  const admins = allUsers.filter((u) => u.role === 'admin' && u.is_active === 'true')
  for (const admin of admins) {
    await Notifications.append({
      id: crypto.randomUUID(),
      recipient_id: admin.id,
      cycle_id: id,
      type: 'escalation',
      message: `Cycle ${cycleResult.row.cycle_month} escalated by ${payload.name}. ${body.notes ?? ''}`,
      is_read: 'false',
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true })
}
