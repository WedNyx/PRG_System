import { NextResponse } from 'next/server'
import packageJson from '../../../../package.json'

export const dynamic = 'force-dynamic'

export function GET() {
  const revision = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null
  return NextResponse.json(
    { version: packageJson.version, revision },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
