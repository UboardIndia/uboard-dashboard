import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Notifications, Users } from '@/lib/sheets'
import { canMarkClearance, isAdmin } from '@/lib/roles'
import { ReminderSchema } from '@/lib/validators'

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const all = await Notifications.byRecipient(payload.userId)
  const unread = all.filter((r) => r.row.is_read === 'false').map((r) => r.row)
  return NextResponse.json({ notifications: unread })
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || (!canMarkClearance(payload.role) && !isAdmin(payload.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = ReminderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { user_id, cycle_id, message } = parsed.data
  await Notifications.append({
    id: crypto.randomUUID(),
    recipient_id: user_id,
    cycle_id,
    type: 'reminder',
    message,
    is_read: 'false',
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
