import { NextResponse } from 'next/server'
import packageJson from '../../../../../package.json'
import { configurado, rest } from '@/lib/nuvem/servidor'

export const dynamic = 'force-dynamic'

/** Checagem pública e simples: o site está no ar e o banco responde? (sem nenhum dado de usuário) */
export async function GET() {
  const inicio = Date.now()
  let banco: 'ok' | 'fora' | 'nao_configurado' = 'nao_configurado'
  if (configurado()) {
    try { await rest('prg_public_adventurers?select=id&limit=1'); banco = 'ok' } catch { banco = 'fora' }
  }
  return NextResponse.json(
    { ok: banco === 'ok', banco, versao: packageJson.version, revisao: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null, ms: Date.now() - inicio },
    { status: banco === 'fora' ? 503 : 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
