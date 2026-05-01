import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Submissions, Cycles } from '@/lib/sheets'
import { isAdmin } from '@/lib/roles'
import { isCycleSignedOff } from '@/lib/cycle'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { id, subId } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cycleResult = await Cycles.byId(id)
  if (!cycleResult) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
  if (isCycleSignedOff(cycleResult.row)) {
    return NextResponse.json({ error: 'Cannot reset submission after sign-off.' }, { status: 403 })
  }

  const subResult = await Submissions.byId(subId)
  if (!subResult) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

  await Submissions.delete(subResult.rowIndex)
  return NextResponse.json({ success: true })
}
