import { NextRequest, NextResponse } from 'next/server'
import { denyToken, extractBearerToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  if (token) await denyToken(token)
  return NextResponse.json({ success: true })
}
