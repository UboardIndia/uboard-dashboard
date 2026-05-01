import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Submissions, Cycles } from '@/lib/sheets'
import { canReadAllSubmissions } from '@/lib/roles'
import { SubmitSchema } from '@/lib/validators'
import { isCycleFrozenOrSignedOff } from '@/lib/cycle'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canReadAllSubmissions(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const results = await Submissions.byCycleId(id)
  return NextResponse.json({ submissions: results.map((r) => r.row) })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cycleResult = await Cycles.byId(id)
  if (!cycleResult) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
  if (isCycleFrozenOrSignedOff(cycleResult.row)) {
    return NextResponse.json({ error: 'Cycle is frozen or signed off. No new submissions.' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = SubmitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { submission_type, data } = parsed.data

  // Check for duplicate submission
  const existing = await Submissions.byCycleId(id)
  const duplicate = existing.find(
    (r) => r.row.user_id === payload.userId && r.row.submission_type === submission_type
  )
  if (duplicate) {
    return NextResponse.json({ error: 'Already submitted for this cycle.' }, { status: 409 })
  }

  await Submissions.append({
    id: crypto.randomUUID(),
    cycle_id: id,
    user_id: payload.userId,
    submission_type,
    data_json: JSON.stringify(data),
    submitted_at: new Date().toISOString(),
    is_locked: submission_type === 'physical_count_arjun' ? 'true' : 'false',
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
