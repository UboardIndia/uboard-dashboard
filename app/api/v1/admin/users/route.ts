import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, isTokenDenied } from '@/lib/auth'
import { Users } from '@/lib/sheets'
import { isAdmin } from '@/lib/roles'
import { CreateUserSchema } from '@/lib/validators'
import { hashPassword } from '@/lib/bcrypt'

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await Users.all()
  const safe = users.map(({ password_hash: _, ...u }) => u)
  return NextResponse.json({ users: safe })
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (!token || await isTokenDenied(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || !isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = CreateUserSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { name, phone, role, password } = parsed.data
  const hash = await hashPassword(password)
  const id = crypto.randomUUID()
  await Users.append({
    id,
    name,
    phone,
    role,
    password_hash: hash,
    is_active: 'true',
    created_at: new Date().toISOString(),
    last_login: '',
  })
  return NextResponse.json({ id }, { status: 201 })
}
