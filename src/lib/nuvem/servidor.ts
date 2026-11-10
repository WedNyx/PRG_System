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

/** Membro que pode mexer (não espectador). Erro amigável para espectadores. */
export async function exigirParticipante(campanhaId: string, aventureiroId: string): Promise<Papel> {
  const p = await papelNaCampanha(campanhaId, aventureiroId)
  if (!p) throw new ErroApi(404, 'Campanha não encontrada.')
  if (p === 'espectador') throw new ErroApi(403, 'Espectadores só assistem e conversam no chat.')
  return p
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
      const local = `${req.method} ${localDaRota(req.nextUrl.pathname)}`
      if (e instanceof ErroApi) {
        if (e.status >= 500 && e.status !== 503) await registrarErro('servidor', local, e.message)
        return NextResponse.json({ erro: e.message }, { status: e.status })
      }
      const msg = e instanceof Error ? e.message : 'erro desconhecido'
      console.error('[prg-api]', msg)
      await registrarErro('servidor', local, msg || 'erro desconhecido', e instanceof Error ? (e.stack ?? '') : '')
      return NextResponse.json({ erro: 'Erro inesperado. Tente novamente.' }, { status: 500 })
    }
  }
}

/** Caminho sem ids (assim erros iguais aparecem juntos e nenhum id vai para o registro). */
export const localDaRota = (p: string) => p.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id').slice(0, 200)

/** Guarda um erro inesperado para o administrador ver em “Saúde da plataforma”. Nunca derruba a requisição. */
export async function registrarErro(origem: 'servidor' | 'navegador', local: string, mensagem: string, detalhe = '') {
  try {
    await fetch(url() + '/rest/v1/prg_erros', {
      method: 'POST', cache: 'no-store',
      headers: { apikey: chave()!, Authorization: 'Bearer ' + chave()!, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ origem, local: local.slice(0, 200), mensagem: (mensagem || '?').slice(0, 500), detalhe: detalhe.slice(0, 2000) }),
    })
  } catch { /* sem banco: só fica no log da Vercel */ }
}
export const ok = (dados: unknown, status = 200) => NextResponse.json(dados, { status, headers: { 'Cache-Control': 'no-store' } })

// ---- Fase 2: histórico e regras da campanha ----
export type EntradaHistorico = {
  ficha_id?: string | null; campanha_id?: string | null; autor_id: string
  tipo: 'edicao' | 'pedido' | 'decisao' | 'envio' | 'aprovacao' | 'bloqueio' | 'npc' | 'administracao' | 'recompensa'
  categoria?: string | null; descricao?: string; antes?: unknown; depois?: unknown
}
/** Registra no histórico. Falhar aqui não deve impedir a ação principal. */
export async function registrar(entradas: EntradaHistorico[]) {
  if (!entradas.length) return
  try { await rest('prg_historico', { method: 'POST', body: JSON.stringify(entradas.map(e => ({ ...e, descricao: (e.descricao ?? '').slice(0, 600) }))) }) }
  catch (e) { console.error('[prg-historico]', e instanceof Error ? e.message : '') }
}

export type FichaRow = {
  id: string; dono_id: string; campanha_id: string | null; origem_id: string | null; sistema: string; nome: string
  dados: Record<string, unknown>; versao: number; status: string; npc: boolean; oculta: boolean
  bloqueada: boolean; areas_bloqueadas: string[]; observacao_mestre: string
}
export async function buscarFicha(id: string): Promise<FichaRow | null> {
  const [f] = await rest<FichaRow[]>(`prg_fichas?select=*&id=eq.${q(id)}&limit=1`)
  return f ?? null
}
export async function regrasDoJogador(campanhaId: string, aventureiroId: string) {
  const [c] = await rest<{ permissoes: Record<string, string>; modelo_padrao: string; estado: string }[]>(`prg_campanhas?select=permissoes,modelo_padrao,estado&id=eq.${q(campanhaId)}`)
  const [m] = await rest<{ excecoes: Record<string, string> }[]>(`prg_campanha_membros?select=excecoes&campanha_id=eq.${q(campanhaId)}&aventureiro_id=eq.${q(aventureiroId)}`)
  return { campanha: c, excecoes: m?.excecoes ?? {} }
}

// ---- v0.11.0: notificações dentro da plataforma (nunca por e-mail) ----
export type NovaNotificacao = { destinatario_id: string; campanha_id?: string | null; tipo: string; titulo: string; texto?: string; link?: string | null }
/** Cria avisos. Falhar aqui nunca impede a ação principal. Quem fez a ação não recebe aviso dela (`autor`). */
export async function notificar(lista: NovaNotificacao[], autor?: string) {
  const vistos = new Set<string>()
  const linhas = lista.filter(n => n.destinatario_id && n.destinatario_id !== autor).filter(n => {
    const k = n.destinatario_id + '|' + n.tipo + '|' + n.titulo; if (vistos.has(k)) return false; vistos.add(k); return true
  }).map(n => ({
    destinatario_id: n.destinatario_id, campanha_id: n.campanha_id ?? null, tipo: n.tipo.slice(0, 40),
    titulo: n.titulo.slice(0, 160), texto: (n.texto ?? '').slice(0, 400), link: n.link && n.link.startsWith('/') ? n.link.slice(0, 300) : null,
  }))
  if (!linhas.length) return
  try { await rest('prg_notificacoes', { method: 'POST', body: JSON.stringify(linhas) }) }
  catch (e) { console.error('[prg-notificacoes]', e instanceof Error ? e.message : '') }
}
/** Participantes da campanha (para avisar o grupo ou só o mestre). */
export async function participantes(campanhaId: string): Promise<{ aventureiro_id: string; papel: string }[]> {
  try { return await rest(`prg_campanha_membros?select=aventureiro_id,papel&campanha_id=eq.${q(campanhaId)}`) } catch { return [] }
}
export const mestresDe = (ps: { aventureiro_id: string; papel: string }[]) => ps.filter(p => p.papel === 'mestre' || p.papel === 'comestre').map(p => p.aventureiro_id)
export async function nomeDaCampanha(campanhaId: string): Promise<string> {
  try { const [c] = await rest<{ nome: string }[]>(`prg_campanhas?select=nome&id=eq.${q(campanhaId)}`); return c?.nome ?? 'campanha' } catch { return 'campanha' }
}
export async function apelidoDe(id: string): Promise<string> {
  try { const [a] = await rest<{ apelido: string }[]>(`prg_public_adventurers?select=apelido&id=eq.${q(id)}`); return a?.apelido ?? 'Alguém' } catch { return 'Alguém' }
}
/** Links usados nos avisos. */
export const linkCampanha = (cid: string) => `/central?secao=campanhas&campanha=${cid}`
export const linkFichaNuvem = (f: { id: string; sistema: string }) => (f.sistema === 'lunethernnyis-v8' ? '/ficha-v8?nuvem=' : '/ficha?nuvem=') + f.id
