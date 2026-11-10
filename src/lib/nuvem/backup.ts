// Somente servidor. Cópias de segurança de todas as tabelas da plataforma (prg_*).
import { ErroApi } from './servidor'

/** Ordem pensada para restaurar (quem é referenciado vem antes). prg_erros fica de fora. */
export const TABELAS_BACKUP = [
  'prg_public_adventurers', 'prg_campanhas', 'prg_campanha_membros', 'prg_convites', 'prg_solicitacoes',
  'prg_sistemas_autorais', 'prg_fichas', 'prg_historico', 'prg_alteracoes', 'prg_notas', 'prg_sessoes',
  'prg_cenas', 'prg_tokens', 'prg_desenhos', 'prg_mesa_eventos', 'prg_playlists', 'prg_musicas',
  'prg_biblioteca', 'prg_notificacoes',
] as const
const ORDEM: Record<string, string> = { prg_campanha_membros: 'campanha_id,aventureiro_id', prg_convites: 'codigo' }
export const BUCKET = 'prg-backups'
export const MANTER = 14
const PAGINA = 1000

const base = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const cab = (extra: Record<string, string> = {}) => ({ apikey: chave()!, Authorization: 'Bearer ' + chave()!, ...extra })

export type Copia = { versao: number; plataforma: string; criado_em: string; tabelas: Record<string, unknown[]> }

/** Lê todas as linhas de todas as tabelas, em páginas de 1000. */
export async function gerarCopia(plataforma: string): Promise<Copia> {
  const tabelas: Record<string, unknown[]> = {}
  for (const t of TABELAS_BACKUP) {
    const linhas: unknown[] = []
    for (let offset = 0; ; offset += PAGINA) {
      const r = await fetch(`${base()}/rest/v1/${t}?select=*&order=${ORDEM[t] ?? 'id'}&limit=${PAGINA}&offset=${offset}`, { cache: 'no-store', headers: cab() })
      if (!r.ok) throw new ErroApi(502, `Não foi possível ler a tabela ${t}.`)
      const pagina = await r.json() as unknown[]
      linhas.push(...pagina)
      if (pagina.length < PAGINA) break
    }
    tabelas[t] = linhas
  }
  return { versao: 1, plataforma, criado_em: new Date().toISOString(), tabelas }
}

export const resumo = (c: Copia) => Object.fromEntries(Object.entries(c.tabelas).map(([t, l]) => [t, l.length]))
/** Uma cópia por dia, no horário de Brasília (en-CA dá o formato AAAA-MM-DD). */
export const nomeDaCopia = (d = new Date()) => `prg-backup-${d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })}.json`
export const NOME_OK = /^prg-backup-\d{4}-\d{2}-\d{2}\.json$/

/** Guarda a cópia na pasta privada (substitui a do mesmo dia). */
export async function guardarCopia(c: Copia): Promise<string> {
  const nome = nomeDaCopia(new Date(c.criado_em))
  const r = await fetch(`${base()}/storage/v1/object/${BUCKET}/${nome}`, {
    method: 'POST', body: JSON.stringify(c), headers: cab({ 'Content-Type': 'application/json', 'x-upsert': 'true' }),
  })
  if (!r.ok) throw new ErroApi(502, 'Não foi possível guardar a cópia de segurança.')
  return nome
}

export type ArquivoCopia = { nome: string; criado_em: string | null; tamanho: number | null }
export async function listarCopias(): Promise<ArquivoCopia[]> {
  const r = await fetch(`${base()}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST', cache: 'no-store', headers: cab({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefix: '', limit: 200, offset: 0, sortBy: { column: 'name', order: 'desc' } }),
  })
  if (!r.ok) throw new ErroApi(502, 'Não foi possível listar as cópias de segurança.')
  const l = await r.json() as { name: string; created_at?: string | null; metadata?: { size?: number } | null }[]
  return l.filter(x => NOME_OK.test(x.name)).map(x => ({ nome: x.name, criado_em: x.created_at ?? null, tamanho: x.metadata?.size ?? null }))
    .sort((a, b) => b.nome.localeCompare(a.nome))
}

/** Apaga as cópias mais antigas, mantendo as últimas MANTER. */
export async function podarCopias(): Promise<string[]> {
  const velhas = (await listarCopias()).slice(MANTER).map(c => c.nome)
  if (!velhas.length) return []
  const r = await fetch(`${base()}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE', headers: cab({ 'Content-Type': 'application/json' }), body: JSON.stringify({ prefixes: velhas }),
  })
  if (!r.ok) throw new ErroApi(502, 'Não foi possível apagar cópias antigas.')
  return velhas
}

export async function baixarCopia(nome: string): Promise<string> {
  if (!NOME_OK.test(nome)) throw new ErroApi(400, 'Nome de cópia inválido.')
  const r = await fetch(`${base()}/storage/v1/object/${BUCKET}/${nome}`, { cache: 'no-store', headers: cab() })
  if (r.status === 404 || r.status === 400) throw new ErroApi(404, 'Cópia não encontrada.')
  if (!r.ok) throw new ErroApi(502, 'Não foi possível baixar a cópia.')
  return r.text()
}
