import { NextRequest, NextResponse } from 'next/server'
import { Users, LoginFailCounter } from '@/lib/sheets'
import { comparePassword } from '@/lib/bcrypt'
import { issueToken } from '@/lib/auth'
import { LoginSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { phone, password } = parsed.data

  const userResult = await Users.byPhone(phone)
  if (!userResult || userResult.row.is_active !== 'true') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const user = userResult.row

  // Lockout check
  const failResult = await LoginFailCounter.byPhone(phone)
  if (failResult) {
    const { fail_count, locked_until } = failResult.row
    if (locked_until && new Date(locked_until) > new Date()) {
      const minsLeft = Math.ceil((new Date(locked_until).getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Account locked. Try again in ${minsLeft} minutes.`, locked: true, minsLeft },
        { status: 401 }
      )
    }
  }

  const valid = await comparePassword(password, user.password_hash)
  if (!valid) {
    // Increment fail counter
    if (!failResult) {
      await LoginFailCounter.append({ phone, fail_count: '1', locked_until: '' })
    } else {
      const newCount = parseInt(failResult.row.fail_count ?? '0') + 1
      const lockedUntil = newCount >= 3 ? new Date(Date.now() + 15 * 60000).toISOString() : ''
      await LoginFailCounter.update(failResult.rowIndex, {
        ...failResult.row,
        fail_count: String(newCount),
        locked_until: lockedUntil,
      })
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Success — reset fail counter, update last_login
  if (failResult) {
    await LoginFailCounter.update(failResult.rowIndex, {
      ...failResult.row,
      fail_count: '0',
      locked_until: '',
    })
  }
  await Users.update(userResult.rowIndex, {
    ...user,
    last_login: new Date().toISOString(),
  })

  const token = issueToken({ userId: user.id, name: user.name, role: user.role })
  return NextResponse.json({ token, user: { id: user.id, name: user.name, role: user.role } })
}
