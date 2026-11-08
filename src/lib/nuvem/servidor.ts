// Somente servidor: nunca importe este arquivo em componentes 'use client'.
import { NextRequest, NextResponse } from 'next/server'
import { isUuid, isPapel, type Papel } from './validacao'

/**
 * Acesso ao Supabase exclusivamente no servidor (service role).
 * IMPORTANTE: nesta fase não há senha/passkey. O aventureiro é indicado pelo
 * cabeçalho `x-prg-aventureiro` (perfil escolhido no portal). Isso NÃO é prova
 * de identidade — decisão consciente para grupo de amigos. As regras abaixo
 * (mestre, membro, dono) impedem bagunça acidental, não ataques deliberados.
 */
export const nuvemAtiva = () => process.env.PRG_SHARED_PROFILES === 'true'
const url = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
export const configurado = () => nuvemAtiva() && !!url() && !!chave()

export class ErroApi extends Error {
  constructor(public status: number, mensagem: string) { super(mensagem) }
}

export async function rest<T = unknown>(caminho: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const { prefer, ...resto } = init
  const r = await fetch(url() + '/rest/v1/' + caminho, {
    ...resto,
    cache: 'no-store',
    headers: {
      apikey: chave()!, Authorization: 'Bearer ' + chave()!, 'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
  })
  if (r.status === 409) throw new ErroApi(409, 'Conflito: já existe um registro igual.')
  if (!r.ok) throw new ErroApi(502, 'Falha ao acessar o banco de dados.')
  if (r.status === 204) return undefined as T
  const texto = await r.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}
export const rpc = <T = unknown>(fn: string, args: Record<string, unknown>) =>
  rest<T>('rpc/' + fn, { method: 'POST', body: JSON.stringify(args) })

export const q = (v: string) => encodeURIComponent(v)

/** Aventureiro que está fazendo a requisição (deve existir no catálogo). */
export async function ator(req: NextRequest): Promise<string> {
  const id = req.headers.get('x-prg-aventureiro')
  if (!isUuid(id)) throw new ErroApi(401, 'Selecione um aventureiro no portal.')
  const rows = await rest<{ id: string }[]>(`prg_public_adventurers?select=id&id=eq.${q(id)}&limit=1`)
  if (!rows.length) throw new ErroApi(401, 'Aventureiro não encontrado.')
  return id
}

export async function papelNaCampanha(campanhaId: string, aventureiroId: string): Promise<Papel | null> {
  if (!isUuid(campanhaId)) return null
  const rows = await rest<{ papel: string }[]>(
    `prg_campanha_membros?select=papel&campanha_id=eq.${q(campanhaId)}&aventureiro_id=eq.${q(aventureiroId)}&limit=1`)
  const p = rows[0]?.papel
  return isPapel(p) ? p : null
}

/** Requisições que alteram dados devem vir do próprio site. */
export function checarOrigem(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || origin !== req.nextUrl.origin) throw new ErroApi(403, 'Origem não permitida.')
}

export async function lerJson(req: NextRequest, limite = 20_000): Promise<unknown> {
  checarOrigem(req)
  if (Number(req.headers.get('content-length') || 0) > limite) throw new ErroApi(413, 'Dados grandes demais.')
  const raw = await req.text()
  if (raw.length > limite) throw new ErroApi(413, 'Dados grandes demais.')
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { throw new ErroApi(400, 'Dados inválidos.') }
}

/** Envolve uma rota: checa configuração e converte erros em JSON. */
export function rota<C>(fn: (req: NextRequest, ctx: C) => Promise<NextResponse>) {
  return async (req: NextRequest, ctx: C) => {
    if (!configurado()) return NextResponse.json({ erro: 'Sincronização na nuvem ainda não configurada.' }, { status: 503 })
    try { return await fn(req, ctx) } catch (e) {
      if (e instanceof ErroApi) return NextResponse.json({ erro: e.message }, { status: e.status })
      console.error('[prg-api]', e instanceof Error ? e.message : 'erro desconhecido')
      return NextResponse.json({ erro: 'Erro inesperado. Tente novamente.' }, { status: 500 })
    }
  }
}
export const ok = (dados: unknown, status = 200) => NextResponse.json(dados, { status, headers: { 'Cache-Control': 'no-store' } })
