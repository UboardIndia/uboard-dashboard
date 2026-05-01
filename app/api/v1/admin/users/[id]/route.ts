import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Users } from '@/lib/sheets'
import { isAdmin } from '@/lib/roles'
import { UpdateUserSchema } from '@/lib/validators'
import { hashPassword } from '@/lib/bcrypt'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Prevent self-role update
  if (id === payload.userId) {
    const body = await req.json().catch(() => ({}))
    if (body.role !== undefined) {
      return NextResponse.json({ error: 'Cannot change your own role.' }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateUserSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const userResult = await Users.byId(id)
  if (!userResult) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Enforce minimum 1 active admin
  if (parsed.data.is_active === false && userResult.row.role === 'admin') {
    const allUsers = await Users.all()
    const activeAdmins = allUsers.filter((u) => u.role === 'admin' && u.is_active === 'true')
    if (activeAdmins.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot deactivate — at least 1 active admin must remain.' },
        { status: 400 }
      )
    }
  }

  const updated = { ...userResult.row }
  if (parsed.data.name) updated.name = parsed.data.name
  if (parsed.data.role) updated.role = parsed.data.role
  if (parsed.data.is_active !== undefined) updated.is_active = String(parsed.data.is_active)
  if (parsed.data.new_password) updated.password_hash = await hashPassword(parsed.data.new_password)

  await Users.update(userResult.rowIndex, updated)
  return NextResponse.json({ success: true })
}
