import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/auth'
import { Users } from '@/lib/sheets'
import { hashPassword } from '@/lib/bcrypt'
import { ResetPasswordSchema } from '@/lib/validators'
import { isAdmin } from '@/lib/roles'

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = ResetPasswordSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { user_id, new_password } = parsed.data
  const userResult = await Users.byId(user_id)
  if (!userResult) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const hash = await hashPassword(new_password)
  await Users.update(userResult.rowIndex, { ...userResult.row, password_hash: hash })
  return NextResponse.json({ success: true })
}
