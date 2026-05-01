import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Cycles } from '@/lib/sheets'
import { canSignOff } from '@/lib/roles'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !canSignOff(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await Cycles.byId(id)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (result.row.status === 'signed_off') {
    return NextResponse.json({ error: 'Already signed off' }, { status: 409 })
  }

  await Cycles.update(result.rowIndex, {
    ...result.row,
    status: 'signed_off',
    signed_off_at: new Date().toISOString(),
    signed_off_by: payload.userId,
  })
  return NextResponse.json({ success: true })
}
