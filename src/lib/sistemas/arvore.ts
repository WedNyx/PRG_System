/**
 * Árvore de habilidades das fichas (todos os sistemas genéricos).
 * Cada hexágono (nó) tem custo em pontos, pré-requisitos (outros nós) e efeitos automáticos:
 *  - bônus (soma num atributo, valor calculado, perícia ou máximo de recurso), igual aos itens equipados;
 *  - habilidade nova, que entra em “Poderes e habilidades” quando o nó é liberado (e sai quando é devolvido).
 * Fica em `dados.arvore` (área “Habilidades” das permissões da campanha). Funções puras, testadas em arvore.test.ts.
 */
import { normalizarPoder, type Poder } from './inventario'

export type EfeitoNo = { tipo: 'bonus'; alvo: string; valor: number } | { tipo: 'poder'; poder: Poder }
export type NoArvore = {
  id: string; nome: string; descricao?: string; custo: number; cor: string; x: number; y: number; requer: string[]; efeitos: EfeitoNo[]
  /** Só pode ser liberado a partir deste nível do personagem (v0.33.6). */
  nivel?: number
}
/** O que mudou na árvore (v0.33.6). `antes` guarda o hexágono (editar/excluir) ou os pontos, para poder desfazer. */
export type AcaoArvore = 'liberar' | 'devolver' | 'conceder' | 'retirar' | 'criar' | 'editar' | 'excluir' | 'pontos'
export type EntradaHistorico = { id: string; acao: AcaoArvore; no?: string; nome: string; em: string; antes?: NoArvore | number; desfeito?: boolean }
export type Arvore = {
  pontos: number; nos: NoArvore[]; liberados: string[]
  /** Liberados pelo mestre como exceção: não gastam pontos nem pedem requisitos (sempre dentro de `liberados`). */
  concedidos?: string[]
  historico?: EntradaHistorico[]
}

export const CORES_NO = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#f87171', '#e2e8f0', '#22d3ee']
export const LIM_ARVORE = { nos: 120, efeitos: 6, requer: 6, nome: 60, descricao: 800, area: 3000, historico: 40 }

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
    const n = lerNo(x, vistos)
    if (n) { vistos.add(n.id); nos.push(n) }
  }
  const ids = new Set(nos.map(n => n.id))
  for (const n of nos) n.requer = [...new Set(n.requer.filter(r => ids.has(r)))]
  const liberados = [...new Set((Array.isArray(o.liberados) ? o.liberados : []).filter((l): l is string => typeof l === 'string' && ids.has(l)))]
  const concedidos = [...new Set((Array.isArray(o.concedidos) ? o.concedidos : []).filter((l): l is string => typeof l === 'string' && liberados.includes(l)))]
  const historico = (Array.isArray(o.historico) ? o.historico : []).slice(0, LIM_ARVORE.historico).map(lerEntrada).filter((e): e is EntradaHistorico => !!e)
  return { pontos: num(o.pontos, 0, 9999), nos, liberados, ...(concedidos.length ? { concedidos } : {}), ...(historico.length ? { historico } : {}) }
}

/** Um hexágono limpo (ou null). `vistos` evita ids repetidos. */
function lerNo(x: unknown, vistos = new Set<string>()): NoArvore | null {
  if (!x || typeof x !== 'object') return null
  const n = x as Record<string, unknown>
  const nome = txt(n.nome, LIM_ARVORE.nome).trim()
  const id = typeof n.id === 'string' && ID.test(n.id) && !vistos.has(n.id) ? n.id : null
  if (!nome || !id) return null
  const cor = typeof n.cor === 'string' && /^#[0-9a-f]{6}$/i.test(n.cor) ? n.cor : CORES_NO[0]
  const descricao = txt(n.descricao, LIM_ARVORE.descricao)
  const efeitos = (Array.isArray(n.efeitos) ? n.efeitos : []).slice(0, LIM_ARVORE.efeitos).map((e, i) => lerEfeito(e, id, i)).filter((e): e is EfeitoNo => !!e)
  const nivel = num(n.nivel, 0, 20)
  return { id, nome, ...(descricao ? { descricao } : {}), custo: num(n.custo, 0, 99, 1), cor,
    x: num(n.x, -LIM_ARVORE.area, LIM_ARVORE.area), y: num(n.y, -LIM_ARVORE.area, LIM_ARVORE.area),
    requer: (Array.isArray(n.requer) ? n.requer : []).filter((r): r is string => typeof r === 'string' && ID.test(r) && r !== id).slice(0, LIM_ARVORE.requer), efeitos,
    ...(nivel > 0 ? { nivel } : {}) }
}

const ACOES: AcaoArvore[] = ['liberar', 'devolver', 'conceder', 'retirar', 'criar', 'editar', 'excluir', 'pontos']
function lerEntrada(v: unknown): EntradaHistorico | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || !ID.test(o.id) || !ACOES.includes(o.acao as AcaoArvore)) return null
  const em = typeof o.em === 'string' && !Number.isNaN(Date.parse(o.em)) ? new Date(o.em).toISOString() : null
  if (!em) return null
  const antes = typeof o.antes === 'number' ? num(o.antes, 0, 9999) : o.antes ? lerNo(o.antes) ?? undefined : undefined
  return { id: o.id, acao: o.acao as AcaoArvore, ...(typeof o.no === 'string' && ID.test(o.no) ? { no: o.no } : {}), nome: txt(o.nome, LIM_ARVORE.nome) || '?', em,
    ...(antes !== undefined ? { antes } : {}), ...(o.desfeito === true ? { desfeito: true } : {}) }
}

/** Pontos gastos (hexágonos concedidos pelo mestre não contam). */
export const gastos = (a: Arvore) => a.nos.reduce((t, n) => t + (a.liberados.includes(n.id) && !a.concedidos?.includes(n.id) ? n.custo : 0), 0)
/** Pontos livres. `extra` = pontos que vêm da progressão por nível (coluna “arvore”). */
export const disponiveis = (a: Arvore, extra = 0) => a.pontos + extra - gastos(a)

/** `nivel` = nível do personagem (null quando o sistema não tem nível: aí o nível mínimo não é conferido). */
export function podeLiberar(a: Arvore, id: string, extra = 0, nivel: number | null = null): { ok: boolean; motivo?: string } {
  const n = a.nos.find(x => x.id === id)
  if (!n) return { ok: false, motivo: 'Hexágono não encontrado.' }
  if (a.liberados.includes(id)) return { ok: false, motivo: 'Já liberado.' }
  if (n.nivel && nivel !== null && nivel < n.nivel) return { ok: false, motivo: `Libera a partir do nível ${n.nivel}.` }
  const faltam = n.requer.filter(r => !a.liberados.includes(r))
  if (faltam.length) return { ok: false, motivo: 'Precisa antes: ' + faltam.map(r => a.nos.find(x => x.id === r)?.nome ?? '?').join(', ') }
  if (disponiveis(a, extra) < n.custo) return { ok: false, motivo: `Faltam ${n.custo - disponiveis(a, extra)} ponto(s).` }
  return { ok: true }
}
export function podeDevolver(a: Arvore, id: string, retirarConcedido = false): { ok: boolean; motivo?: string } {
  if (!a.liberados.includes(id)) return { ok: false, motivo: 'Ainda não foi liberado.' }
  if (!retirarConcedido && a.concedidos?.includes(id)) return { ok: false, motivo: 'Concedido pelo mestre: só ele retira.' }
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


/**
 * Traz a árvore do sistema para a ficha: hexágonos novos entram, os que já existem são atualizados
 * (nome, custo, efeitos, posição), os criados só na ficha ficam. O que já foi liberado e os pontos continuam.
 */
export function mesclarArvore(ficha: Arvore, doSistema: { pontos?: number; nos: unknown[] }): Arvore {
  const sis = lerArvore({ pontos: 0, nos: doSistema.nos })
  const ids = new Set(sis.nos.map(n => n.id))
  return lerArvore({ ...ficha, nos: [...sis.nos, ...ficha.nos.filter(n => !ids.has(n.id))] })
}
/** A árvore da ficha está diferente da do sistema (algo novo ou mudado)? */
export function difereDoSistema(ficha: Arvore, doSistema: { nos: unknown[] }): boolean {
  const sis = lerArvore({ nos: doSistema.nos })
  return sis.nos.some(n => { const f = ficha.nos.find(x => x.id === n.id); return !f || JSON.stringify(f) !== JSON.stringify(n) })
}

/* ───────── Ações com histórico e desfazer (v0.33.6) ───────── */

type Resultado = { arvore: Arvore; erro?: undefined } | { arvore?: undefined; erro: string }
const idHist = () => 'h' + Math.random().toString(36).slice(2, 10)

/** Põe uma entrada no começo do histórico (guarda as últimas 40). */
export function comHistorico(a: Arvore, e: Omit<EntradaHistorico, 'id' | 'em'>, agora = new Date()): Arvore {
  return { ...a, historico: [{ id: idHist(), em: agora.toISOString(), ...e }, ...(a.historico ?? [])].slice(0, LIM_ARVORE.historico) }
}
const tirar = (l: string[] | undefined, id: string) => (l ?? []).filter(x => x !== id)
const semVazio = (a: Arvore): Arvore => { const { concedidos, ...r } = a; return concedidos?.length ? a : r }

export function liberarNo(a: Arvore, id: string, extra = 0, nivel: number | null = null): Resultado {
  const p = podeLiberar(a, id, extra, nivel); if (!p.ok) return { erro: p.motivo! }
  return { arvore: comHistorico({ ...a, liberados: [...a.liberados, id] }, { acao: 'liberar', no: id, nome: nomeDe(a, id) }) }
}
export function devolverNo(a: Arvore, id: string): Resultado {
  const p = podeDevolver(a, id); if (!p.ok) return { erro: p.motivo! }
  return { arvore: comHistorico({ ...a, liberados: tirar(a.liberados, id) }, { acao: 'devolver', no: id, nome: nomeDe(a, id) }) }
}
/** Exceção do mestre: libera sem gastar pontos, sem requisitos e sem nível mínimo. */
export function concederNo(a: Arvore, id: string): Resultado {
  if (!a.nos.some(n => n.id === id)) return { erro: 'Hexágono não encontrado.' }
  if (a.concedidos?.includes(id)) return { erro: 'Já concedido.' }
  // Se já estava liberado com pontos, os pontos voltam (passa a ser de graça).
  return { arvore: comHistorico({ ...a, liberados: a.liberados.includes(id) ? a.liberados : [...a.liberados, id], concedidos: [...(a.concedidos ?? []), id] }, { acao: 'conceder', no: id, nome: nomeDe(a, id) }) }
}
export function retirarNo(a: Arvore, id: string): Resultado {
  if (!a.concedidos?.includes(id)) return { erro: 'Não foi concedido pelo mestre.' }
  const p = podeDevolver(a, id, true); if (!p.ok) return { erro: p.motivo! }
  return { arvore: comHistorico(semVazio({ ...a, liberados: tirar(a.liberados, id), concedidos: tirar(a.concedidos, id) }), { acao: 'retirar', no: id, nome: nomeDe(a, id) }) }
}
/** Cria ou edita (também usado ao ligar hexágonos). */
export function gravarNoArvore(a: Arvore, n: NoArvore): Arvore {
  const antes = a.nos.find(x => x.id === n.id)
  const nova = lerArvore({ ...a, nos: antes ? a.nos.map(x => x.id === n.id ? n : x) : [...a.nos, n] })
  return comHistorico(nova, antes ? { acao: 'editar', no: n.id, nome: n.nome, antes } : { acao: 'criar', no: n.id, nome: n.nome })
}
export function excluirNoArvore(a: Arvore, id: string): Arvore {
  const antes = a.nos.find(x => x.id === id); if (!antes) return a
  return comHistorico(lerArvore({ ...a, nos: a.nos.filter(x => x.id !== id), liberados: tirar(a.liberados, id), concedidos: tirar(a.concedidos, id) }), { acao: 'excluir', no: id, nome: antes.nome, antes })
}
export function mudarPontos(a: Arvore, pontos: number): Resultado {
  const novo = Math.max(0, Math.min(9999, Math.round(pontos)))
  if (novo < gastos(a)) return { erro: `Já há ${gastos(a)} ponto(s) gastos. Devolva hexágonos antes.` }
  return { arvore: comHistorico({ ...a, pontos: novo }, { acao: 'pontos', nome: `${a.pontos} → ${novo} pontos`, antes: a.pontos }) }
}
const nomeDe = (a: Arvore, id: string) => a.nos.find(n => n.id === id)?.nome ?? '?'

export const TEXTO_ACAO: Record<AcaoArvore, string> = {
  liberar: 'Liberou', devolver: 'Devolveu', conceder: 'Mestre concedeu', retirar: 'Mestre retirou', criar: 'Criou', editar: 'Editou', excluir: 'Excluiu', pontos: 'Pontos ganhos',
}
/** Ações que só o mestre pode desfazer. */
export const ACOES_DO_MESTRE: AcaoArvore[] = ['conceder', 'retirar']

/**
 * Desfaz uma entrada do histórico aplicando o contrário NA ÁRVORE DE AGORA (com as mesmas regras):
 * liberar ↔ devolver, conceder ↔ retirar, criar → apaga, editar/excluir → volta o hexágono como era, pontos → valor de antes.
 * A entrada fica marcada como desfeita (não some, para o mestre ver).
 */
export function desfazer(a: Arvore, entradaId: string, extra = 0, nivel: number | null = null): Resultado {
  const e = a.historico?.find(x => x.id === entradaId)
  if (!e) return { erro: 'Entrada não encontrada.' }
  if (e.desfeito) return { erro: 'Já foi desfeita.' }
  const marcar = (b: Arvore): Arvore => ({ ...b, historico: (a.historico ?? []).map(x => x.id === e.id ? { ...x, desfeito: true } : x) })
  const no = e.no ? a.nos.find(n => n.id === e.no) : undefined
  switch (e.acao) {
    case 'liberar': { if (!e.no) break; const p = podeDevolver(a, e.no); if (!p.ok) return { erro: p.motivo! }; return { arvore: marcar({ ...a, liberados: tirar(a.liberados, e.no) }) } }
    case 'devolver': { if (!e.no) break; const p = podeLiberar(a, e.no, extra, nivel); if (!p.ok) return { erro: p.motivo! }; return { arvore: marcar({ ...a, liberados: [...a.liberados, e.no] }) } }
    case 'conceder': { if (!e.no) break; const p = podeDevolver(a, e.no, true); if (!p.ok) return { erro: p.motivo! }; return { arvore: marcar(semVazio({ ...a, liberados: tirar(a.liberados, e.no), concedidos: tirar(a.concedidos, e.no) })) } }
    case 'retirar': { if (!e.no || !no) return { erro: 'O hexágono não existe mais.' }; return { arvore: marcar({ ...a, liberados: [...new Set([...a.liberados, e.no])], concedidos: [...new Set([...(a.concedidos ?? []), e.no])] }) } }
    case 'criar': { if (!e.no || !no) return { erro: 'O hexágono já não existe.' }
      if (a.nos.some(n => a.liberados.includes(n.id) && n.requer.includes(e.no!))) return { erro: 'Há hexágonos liberados que dependem dele.' }
      return { arvore: marcar(lerArvore({ ...a, nos: a.nos.filter(n => n.id !== e.no), liberados: tirar(a.liberados, e.no), concedidos: tirar(a.concedidos, e.no) })) } }
    case 'editar': { if (!e.antes || typeof e.antes === 'number') break
      const antes = e.antes
      return { arvore: marcar(lerArvore({ ...a, nos: no ? a.nos.map(n => n.id === antes.id ? antes : n) : [...a.nos, antes] })) } }
    case 'excluir': { if (!e.antes || typeof e.antes === 'number') break
      if (no) return { erro: 'Já existe um hexágono com esse código.' }
      if (a.nos.length >= LIM_ARVORE.nos) return { erro: 'A árvore está cheia.' }
      return { arvore: marcar(lerArvore({ ...a, nos: [...a.nos, e.antes] })) } }
    case 'pontos': { if (typeof e.antes !== 'number') break
      if (e.antes < gastos(a)) return { erro: `Já há ${gastos(a)} ponto(s) gastos. Devolva hexágonos antes.` }
      return { arvore: marcar({ ...a, pontos: e.antes }) } }
  }
  return { erro: 'Não dá para desfazer esta entrada.' }
}
