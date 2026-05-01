import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Cycles } from '@/lib/sheets'
import { isAdmin } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cycles = await Cycles.all()
  return NextResponse.json({ cycles: cycles.sort((a, b) => b.cycle_month.localeCompare(a.cycle_month)) })
}
