import { NextRequest, NextResponse } from 'next/server'
import { issueToken } from '@/lib/auth'
import { LoginSchema } from '@/lib/validators'

const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '9999999999'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123'
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Asis'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { phone, password } = parsed.data

  if (phone !== ADMIN_PHONE || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = issueToken({
    userId: '00000000-0000-0000-0000-000000000001',
    name: ADMIN_NAME,
    role: 'admin',
  })
  return NextResponse.json({
    token,
    user: { id: '00000000-0000-0000-0000-000000000001', name: ADMIN_NAME, role: 'admin' },
  })
}
