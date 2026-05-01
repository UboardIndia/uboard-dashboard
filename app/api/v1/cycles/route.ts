import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Cycles } from '@/lib/sheets'
import { getActiveCycle } from '@/lib/cycle'
import { isAdmin } from '@/lib/roles'
import { CreateCycleSchema } from '@/lib/validators'

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cycle = await getActiveCycle()
  return NextResponse.json({ cycle })
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = CreateCycleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const id = crypto.randomUUID()
  await Cycles.append({
    id,
    cycle_month: parsed.data.cycle_month,
    status: 'active',
    created_at: new Date().toISOString(),
    frozen_at: '',
    signed_off_at: '',
    signed_off_by: '',
  })
  return NextResponse.json({ id }, { status: 201 })
}
