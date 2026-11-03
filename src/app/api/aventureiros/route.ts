import { NextRequest, NextResponse } from 'next/server'
import { validarApelidoAventureiro } from '@/lib/auth/aventureiro'

export const dynamic = 'force-dynamic'
const enabled = () => process.env.PRG_SHARED_PROFILES === 'true'
const url = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY
const headers = () => ({ apikey: key()!, Authorization: 'Bearer ' + key()!, 'Content-Type': 'application/json' })
const unavailable = () => NextResponse.json({ erro: 'Catálogo compartilhado ainda não configurado.' }, { status: 503 })

export async function GET() {
  if (!enabled() || !url() || !key()) return unavailable()
  try {
    const response = await fetch(url() + '/rest/v1/prg_public_adventurers?select=id,apelido,avatar&order=created_at.asc&limit=200', { headers: headers(), cache: 'no-store' })
    if (!response.ok) throw new Error('Falha no catálogo')
    const perfis = await response.json()
    return NextResponse.json({ perfis }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return NextResponse.json({ erro: 'Não foi possível carregar os aventureiros.' }, { status: 502 }) }
}

export async function POST(request: NextRequest) {
  if (!enabled() || !url() || !key()) return unavailable()
  // Controle de origem reduz envios acidentais entre sites; não substitui antiabuso.
  const origin = request.headers.get('origin')
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ erro: 'Origem não permitida.' }, { status: 403 })
  if (Number(request.headers.get('content-length') || 0) > 160_000) return NextResponse.json({ erro: 'Foto muito grande.' }, { status: 413 })
  let payload: unknown
  try {
    const raw = await request.text()
    if (raw.length > 160_000) return NextResponse.json({ erro: 'Foto muito grande.' }, { status: 413 })
    payload = JSON.parse(raw)
  } catch { return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 }) }
  if (!payload || typeof payload !== 'object') return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 })
  const body = payload as Record<string, unknown>
  const valid = validarApelidoAventureiro(body.apelido)
  if (!valid.ok) return NextResponse.json({ erro: valid.erro }, { status: 400 })
  const avatar = body.avatar === undefined || body.avatar === null ? null : body.avatar
  if (avatar !== null && (typeof avatar !== 'string' || avatar.length > 120_000 || !/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(avatar)))
    return NextResponse.json({ erro: 'Foto inválida ou muito grande.' }, { status: 400 })
  try {
    const response = await fetch(url() + '/rest/v1/prg_public_adventurers?select=id,apelido,avatar', {
      method: 'POST', headers: { ...headers(), Prefer: 'return=representation' },
      body: JSON.stringify({ apelido: valid.apelido, avatar }),
      cache: 'no-store',
    })
    if (response.status === 409) return NextResponse.json({ erro: 'Esse apelido já está em uso.' }, { status: 409 })
    if (!response.ok) throw new Error('Falha ao cadastrar')
    const result = await response.json()
    return NextResponse.json({ perfil: result[0] }, { status: 201 })
  } catch { return NextResponse.json({ erro: 'Não foi possível cadastrar o aventureiro.' }, { status: 502 }) }
}
