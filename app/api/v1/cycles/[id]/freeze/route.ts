import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Cycles } from '@/lib/sheets'
import { isAdmin } from '@/lib/roles'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await Cycles.byId(id)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await Cycles.update(result.rowIndex, {
    ...result.row,
    status: 'frozen',
    frozen_at: new Date().toISOString(),
  })
  return NextResponse.json({ success: true })
}
