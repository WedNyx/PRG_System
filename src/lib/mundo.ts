/**
 * Mundo da campanha: mapa-múndi com alfinetes, páginas (lugares, NPCs, facções…) e teia de relações.
 * Tudo numa estrutura só (prg_campanhas.mundo). Funções puras, testadas em mundo.test.ts.
 */
import { imagemDaPlataforma } from './nuvem/validacao'

export type TipoPagina = 'lugar' | 'npc' | 'faccao' | 'perigo' | 'segredo' | 'item'
export type TipoRelacao = 'aliado' | 'inimigo' | 'rival' | 'familia' | 'amor' | 'serve' | 'neutro'
export type Pagina = { id: string; nome: string; tipo: TipoPagina; icone: string; texto?: string; imagem?: string; oculto?: boolean
  /** Posição no mapa, em % (0–100). */ mapa?: { x: number; y: number }
  /** Posição na teia de relações (0–1000 × 0–700). */ teia?: { x: number; y: number } }
export type Relacao = { id: string; de: string; para: string; tipo: TipoRelacao; rotulo?: string; oculto?: boolean }
export type Mundo = { versao: number; mapa?: string; paginas: Pagina[]; relacoes: Relacao[] }

export const TIPOS_PAGINA: { id: TipoPagina; nome: string; icone: string }[] = [
  { id: 'lugar', nome: 'Lugar', icone: '🏰' }, { id: 'npc', nome: 'Personagem', icone: '👤' }, { id: 'faccao', nome: 'Facção', icone: '🛡️' },
  { id: 'perigo', nome: 'Perigo', icone: '🐉' }, { id: 'segredo', nome: 'Segredo', icone: '❓' }, { id: 'item', nome: 'Item/relíquia', icone: '💎' },
]
export const TIPOS_RELACAO: { id: TipoRelacao; nome: string; cor: string; tracejado?: boolean }[] = [
  { id: 'aliado', nome: 'Aliados', cor: '#10b981' }, { id: 'inimigo', nome: 'Inimigos', cor: '#ef4444' }, { id: 'rival', nome: 'Rivais', cor: '#f59e0b', tracejado: true },
  { id: 'familia', nome: 'Família', cor: '#38bdf8' }, { id: 'amor', nome: 'Amor', cor: '#ec4899' }, { id: 'serve', nome: 'Serve a', cor: '#a78bfa', tracejado: true },
  { id: 'neutro', nome: 'Conhecidos', cor: '#94a3b8', tracejado: true },
]
export const ICONES = ['🏰', '🏯', '🏘️', '🏚️', '⛪', '⛩️', '🗼', '🌲', '⛰️', '🌋', '🏝️', '🏜️', '❄️', '🌊', '⚓', '🕳️', '🗿', '⚔️', '🔥', '💀', '🐉', '👹', '👤', '👑', '🧙', '🧝', '🧛', '🐍', '🐺', '🦇', '🛡️', '🗡️', '📜', '💎', '❓', '❗', '⭐']
export const LIM_MUNDO = { paginas: 150, relacoes: 300, nome: 60, texto: 3000, rotulo: 40 }

const ID = /^[A-Za-z0-9_-]{1,40}$/
const txt = (v: unknown, max: number) => typeof v === 'string' ? v.slice(0, max) : ''
const num = (v: unknown, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n * 10) / 10)) : null }
const ponto = (v: unknown, mx: number, my: number) => {
  if (!v || typeof v !== 'object') return undefined
  const o = v as Record<string, unknown>, x = num(o.x, 0, mx), y = num(o.y, 0, my)
  return x === null || y === null ? undefined : { x, y }
}

export function lerMundo(v: unknown): Mundo {
  const o = v && typeof v === 'object' ? v as Record<string, unknown> : {}
  const vistos = new Set<string>()
  const paginas: Pagina[] = (Array.isArray(o.paginas) ? o.paginas : []).slice(0, LIM_MUNDO.paginas).flatMap(x => {
    const p = x && typeof x === 'object' ? x as Record<string, unknown> : {}
    const nome = txt(p.nome, LIM_MUNDO.nome).trim()
    if (!nome || typeof p.id !== 'string' || !ID.test(p.id) || vistos.has(p.id)) return []
    vistos.add(p.id)
    const tipo = TIPOS_PAGINA.some(t => t.id === p.tipo) ? p.tipo as TipoPagina : 'lugar'
    const icone = typeof p.icone === 'string' && ICONES.includes(p.icone) ? p.icone : TIPOS_PAGINA.find(t => t.id === tipo)!.icone
    const texto = txt(p.texto, LIM_MUNDO.texto), mapa = ponto(p.mapa, 100, 100), teia = ponto(p.teia, 1000, 700)
    return [{ id: p.id, nome, tipo, icone, ...(texto ? { texto } : {}), ...(imagemDaPlataforma(p.imagem) ? { imagem: p.imagem } : {}),
      ...(p.oculto === true ? { oculto: true } : {}), ...(mapa ? { mapa } : {}), ...(teia ? { teia } : {}) }]
  })
  const ids = new Set(paginas.map(p => p.id)), rel = new Set<string>()
  const relacoes: Relacao[] = (Array.isArray(o.relacoes) ? o.relacoes : []).slice(0, LIM_MUNDO.relacoes).flatMap(x => {
    const r = x && typeof x === 'object' ? x as Record<string, unknown> : {}
    if (typeof r.id !== 'string' || !ID.test(r.id) || rel.has(r.id)) return []
    if (typeof r.de !== 'string' || typeof r.para !== 'string' || !ids.has(r.de) || !ids.has(r.para) || r.de === r.para) return []
    rel.add(r.id)
    const tipo = TIPOS_RELACAO.some(t => t.id === r.tipo) ? r.tipo as TipoRelacao : 'neutro'
    const rotulo = txt(r.rotulo, LIM_MUNDO.rotulo).trim()
    return [{ id: r.id, de: r.de, para: r.para, tipo, ...(rotulo ? { rotulo } : {}), ...(r.oculto === true ? { oculto: true } : {}) }]
  })
  return { versao: Math.max(0, Math.floor(Number(o.versao)) || 0), ...(imagemDaPlataforma(o.mapa) ? { mapa: o.mapa as string } : {}), paginas, relacoes }
}

/** O que os jogadores veem: sem páginas “só o mestre” e sem relações escondidas ou ligadas a elas. */
export function mundoParaJogador(m: Mundo): Mundo {
  const paginas = m.paginas.filter(p => !p.oculto), ids = new Set(paginas.map(p => p.id))
  return { ...m, paginas, relacoes: m.relacoes.filter(r => !r.oculto && ids.has(r.de) && ids.has(r.para)) }
}

/** Posição na teia para quem ainda não tem: um círculo em volta do meio. */
export function posicaoNaTeia(i: number, total: number) {
  const a = (i / Math.max(1, total)) * Math.PI * 2 - Math.PI / 2, r = total <= 1 ? 0 : 250
  return { x: Math.round(500 + Math.cos(a) * r * 1.3), y: Math.round(350 + Math.sin(a) * r) }
}
export const novoId = () => Math.random().toString(36).slice(2, 12)
