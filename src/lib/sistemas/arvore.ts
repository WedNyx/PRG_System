/**
 * Árvore de habilidades das fichas (todos os sistemas genéricos).
 * Cada hexágono (nó) tem custo em pontos, pré-requisitos (outros nós) e efeitos automáticos:
 *  - bônus (soma num atributo, valor calculado, perícia ou máximo de recurso), igual aos itens equipados;
 *  - habilidade nova, que entra em “Poderes e habilidades” quando o nó é liberado (e sai quando é devolvido).
 * Fica em `dados.arvore` (área “Habilidades” das permissões da campanha). Funções puras, testadas em arvore.test.ts.
 */
import { normalizarPoder, type Poder } from './inventario'

export type EfeitoNo = { tipo: 'bonus'; alvo: string; valor: number } | { tipo: 'poder'; poder: Poder }
export type NoArvore = { id: string; nome: string; descricao?: string; custo: number; cor: string; x: number; y: number; requer: string[]; efeitos: EfeitoNo[] }
export type Arvore = { pontos: number; nos: NoArvore[]; liberados: string[] }

export const CORES_NO = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#f87171', '#e2e8f0', '#22d3ee']
export const LIM_ARVORE = { nos: 120, efeitos: 6, requer: 6, nome: 60, descricao: 800, area: 3000 }

const txt = (v: unknown, max: number) => typeof v === 'string' ? v.slice(0, max) : ''
const num = (v: unknown, min: number, max: number, padrao = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : padrao }
const ID = /^[A-Za-z0-9_-]{1,40}$/
const ALVO = /^(derivado|atributo|pericia|recurso):[A-Za-z0-9_]{1,40}$/

export const arvoreVazia = (): Arvore => ({ pontos: 0, nos: [], liberados: [] })
export const novoIdNo = () => 'n' + Math.random().toString(36).slice(2, 10)

function lerEfeito(v: unknown, noId: string, i: number): EfeitoNo | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (o.tipo === 'bonus' && typeof o.alvo === 'string' && ALVO.test(o.alvo) && Number(o.valor)) return { tipo: 'bonus', alvo: o.alvo, valor: num(o.valor, -99, 99) }
  if (o.tipo === 'poder') {
    // O id da habilidade é fixo pelo nó: assim ela entra e sai da lista de poderes sem duplicar.
    const p = normalizarPoder({ ...(o.poder && typeof o.poder === 'object' ? o.poder as object : {}), id: idPoderDoNo(noId, i) })
    return p ? { tipo: 'poder', poder: p } : null
  }
  return null
}
export const idPoderDoNo = (noId: string, i: number) => `arv-${noId}-${i}`.slice(0, 40)

/** Limpa e valida a árvore vinda do navegador/banco. Nós com requisito inexistente perdem só esse requisito. */
export function lerArvore(v: unknown): Arvore {
  if (!v || typeof v !== 'object') return arvoreVazia()
  const o = v as Record<string, unknown>
  const vistos = new Set<string>()
  const nos: NoArvore[] = []
  for (const x of (Array.isArray(o.nos) ? o.nos : []).slice(0, LIM_ARVORE.nos)) {
    if (!x || typeof x !== 'object') continue
    const n = x as Record<string, unknown>
    const nome = txt(n.nome, LIM_ARVORE.nome).trim()
    const id = typeof n.id === 'string' && ID.test(n.id) && !vistos.has(n.id) ? n.id : null
    if (!nome || !id) continue
    vistos.add(id)
    const cor = typeof n.cor === 'string' && /^#[0-9a-f]{6}$/i.test(n.cor) ? n.cor : CORES_NO[0]
    const descricao = txt(n.descricao, LIM_ARVORE.descricao)
    const efeitos = (Array.isArray(n.efeitos) ? n.efeitos : []).slice(0, LIM_ARVORE.efeitos).map((e, i) => lerEfeito(e, id, i)).filter((e): e is EfeitoNo => !!e)
    nos.push({ id, nome, ...(descricao ? { descricao } : {}), custo: num(n.custo, 0, 99, 1), cor,
      x: num(n.x, -LIM_ARVORE.area, LIM_ARVORE.area), y: num(n.y, -LIM_ARVORE.area, LIM_ARVORE.area),
      requer: (Array.isArray(n.requer) ? n.requer : []).filter((r): r is string => typeof r === 'string' && ID.test(r) && r !== id).slice(0, LIM_ARVORE.requer), efeitos })
  }
  const ids = new Set(nos.map(n => n.id))
  for (const n of nos) n.requer = [...new Set(n.requer.filter(r => ids.has(r)))]
  const liberados = [...new Set((Array.isArray(o.liberados) ? o.liberados : []).filter((l): l is string => typeof l === 'string' && ids.has(l)))]
  return { pontos: num(o.pontos, 0, 9999), nos, liberados }
}

export const gastos = (a: Arvore) => a.nos.reduce((t, n) => t + (a.liberados.includes(n.id) ? n.custo : 0), 0)
export const disponiveis = (a: Arvore) => a.pontos - gastos(a)

export function podeLiberar(a: Arvore, id: string): { ok: boolean; motivo?: string } {
  const n = a.nos.find(x => x.id === id)
  if (!n) return { ok: false, motivo: 'Hexágono não encontrado.' }
  if (a.liberados.includes(id)) return { ok: false, motivo: 'Já liberado.' }
  const faltam = n.requer.filter(r => !a.liberados.includes(r))
  if (faltam.length) return { ok: false, motivo: 'Precisa antes: ' + faltam.map(r => a.nos.find(x => x.id === r)?.nome ?? '?').join(', ') }
  if (disponiveis(a) < n.custo) return { ok: false, motivo: `Faltam ${n.custo - disponiveis(a)} ponto(s).` }
  return { ok: true }
}
export function podeDevolver(a: Arvore, id: string): { ok: boolean; motivo?: string } {
  if (!a.liberados.includes(id)) return { ok: false, motivo: 'Ainda não foi liberado.' }
  const dependem = a.nos.filter(n => a.liberados.includes(n.id) && n.requer.includes(id))
  if (dependem.length) return { ok: false, motivo: 'Devolva antes: ' + dependem.map(n => n.nome).join(', ') }
  return { ok: true }
}

/** Habilidades que os nós liberados dão (entram em “Poderes e habilidades”). */
export const poderesDaArvore = (a: Arvore): Poder[] =>
  a.nos.filter(n => a.liberados.includes(n.id)).flatMap(n => n.efeitos.flatMap(e => e.tipo === 'poder' ? [e.poder] : []))

/** Bônus somados de todos os nós liberados, por alvo (mesmo formato dos itens). */
export function bonusDaArvore(a: Arvore): Record<string, number> {
  const out: Record<string, number> = {}
  for (const n of a.nos) if (a.liberados.includes(n.id)) for (const e of n.efeitos) if (e.tipo === 'bonus') out[e.alvo] = (out[e.alvo] ?? 0) + e.valor
  return out
}
export const somarBonus = (...bs: Record<string, number>[]) => {
  const out: Record<string, number> = {}
  for (const b of bs) for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v
  return out
}

/**
 * Sincroniza a lista de poderes da ficha com a árvore: tira as habilidades de nós que não estão mais liberados
 * (ou que mudaram) e coloca as dos liberados. Poderes que não vieram da árvore ficam como estão.
 */
export function sincronizarPoderes(poderes: Poder[], a: Arvore): Poder[] {
  const daArvore = poderesDaArvore(a)
  const outros = poderes.filter(p => !p.id.startsWith('arv-'))
  return [...outros, ...daArvore]
}

/** Uma árvore pequena de exemplo, para quem quer começar rápido. */
export function arvoreExemplo(alvos: { id: string; nome: string }[]): Arvore {
  const alvo = alvos.find(x => x.id.startsWith('atributo:'))?.id ?? alvos[0]?.id
  const b = (valor: number): EfeitoNo[] => alvo ? [{ tipo: 'bonus', alvo, valor } as EfeitoNo] : []
  const poder = (nome: string, expressao: string, descricao: string): EfeitoNo => ({ tipo: 'poder', poder: { id: '', nome, tipo: 'habilidade', expressao, descricao } })
  const nos: NoArvore[] = [
    { id: 'raiz', nome: 'Despertar', descricao: 'O começo do caminho.', custo: 1, cor: '#e2e8f0', x: 0, y: 0, requer: [], efeitos: b(1) },
    { id: 'fogo', nome: 'Centelha', descricao: 'Uma pequena chama na ponta dos dedos.', custo: 1, cor: '#f87171', x: -160, y: -150, requer: ['raiz'], efeitos: [poder('Centelha', '1d6', 'Dano de fogo a curta distância.')] },
    { id: 'gelo', nome: 'Toque Gélido', descricao: 'O frio obedece.', custo: 1, cor: '#38bdf8', x: 160, y: -150, requer: ['raiz'], efeitos: [poder('Toque Gélido', '1d4', 'Deixa o alvo lento.')] },
    { id: 'fogo2', nome: 'Labareda', descricao: 'A centelha vira incêndio.', custo: 2, cor: '#f87171', x: -160, y: -310, requer: ['fogo'], efeitos: [poder('Labareda', '2d6', 'Atinge uma área.')] },
    { id: 'mestre', nome: 'Equilíbrio', descricao: 'Fogo e gelo juntos.', custo: 3, cor: '#fbbf24', x: 0, y: -460, requer: ['fogo2', 'gelo'], efeitos: b(2) },
  ]
  return lerArvore({ pontos: 3, nos: nos.map(n => ({ ...n, efeitos: n.efeitos.map(e => e.tipo === 'poder' ? { tipo: 'poder', poder: e.poder } : e) })), liberados: [] })
}

