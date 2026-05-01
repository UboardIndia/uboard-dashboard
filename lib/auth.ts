import jwt from 'jsonwebtoken'
import type { JwtPayload } from '@/types/api'
import { LoginDenyList } from './sheets'

const SECRET = process.env.JWT_SECRET!
const EXPIRY = (process.env.JWT_EXPIRY ?? '30d') as string

export function issueToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload
  } catch {
    return null
  }
}

export async function isTokenDenied(token: string): Promise<boolean> {
  const result = await LoginDenyList.byToken(token)
  return result !== null
}

export async function denyToken(token: string): Promise<void> {
  await LoginDenyList.append({
    token,
    invalidated_at: new Date().toISOString(),
  })
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
