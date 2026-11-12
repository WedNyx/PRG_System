/**
 * Dados de Assimilação RPG (v0.33.3): d6 (Instinto), d10 (Conhecimento/Prática) e d12 (Rolagem Assimilada e
 * Teste de Assimilação) com faces de Sucesso (A), Adaptação (B) e Pressão (C).
 * Rola dados numéricos e converte pela correspondência de faces (mecânica; sem textos do livro).
 */
export type Face = { a: number; b: number; c: number }
export type LadoAssim = 6 | 10 | 12
export type DadoAssim = { lados: LadoAssim; valor: number; face: Face }

const F = (a: number, b: number, c: number): Face => ({ a, b, c })
const VAZIA = F(0, 0, 0)
/** Faces 1–10 iguais no d10 e no d12; o d12 tem mais duas. */
const BASE = [VAZIA, VAZIA, F(0, 0, 1), F(0, 0, 1), F(0, 1, 1), F(1, 0, 0), F(2, 0, 0), F(1, 1, 0), F(1, 1, 1), F(2, 0, 1)]
export const FACES: Record<LadoAssim, Face[]> = {
  6: [VAZIA, VAZIA, F(0, 0, 1), F(0, 0, 1), F(0, 1, 1), F(1, 0, 0)],
  10: BASE,
  12: [...BASE, F(1, 2, 1), F(0, 0, 2)],
}
export const faceDe = (lados: LadoAssim, valor: number): Face => FACES[lados][Math.min(lados, Math.max(1, Math.round(valor))) - 1] ?? VAZIA

export type MontagemTeste = {
  instinto: number
  /** Conhecimento ou Prática (0 = nenhum). Ignorado se agir por instinto. */
  aptidao: number
  /** Agir por Instinto: valor do segundo Instinto (todos os dados viram d12 e mantém +1). */
  segundoInstinto?: number | null
  /** Pontos de Determinação gastos para manter dados (normalmente 0 ou 1 por rodada). */
  determinacao?: number
  /** Origens ativadas (0 a 2). */
  origens?: number
}
export const MAX_MANTIDOS = 4

/** Quantos dados de cada tipo rolar e quantos manter. */
export function montarTeste(m: MontagemTeste) {
  const inst = Math.max(0, Math.floor(m.instinto) || 0)
  const assimilada = m.segundoInstinto !== undefined && m.segundoInstinto !== null
  const grupos: { lados: LadoAssim; qtd: number }[] = assimilada
    ? [{ lados: 12, qtd: inst + Math.max(0, Math.floor(m.segundoInstinto!) || 0) }]
    : [{ lados: 6, qtd: inst }, { lados: 10, qtd: Math.max(0, Math.floor(m.aptidao) || 0) }]
  const validos = grupos.filter(g => g.qtd > 0)
  const total = validos.reduce((s, g) => s + g.qtd, 0)
  const manter = Math.max(1, Math.min(MAX_MANTIDOS, total, 1 + (m.determinacao ?? 0) + (m.origens ?? 0) + (assimilada ? 1 : 0)))
  return { grupos: validos, expressao: validos.map(g => `${g.qtd}d${g.lados}`).join('+'), manter, total }
}

/** Converte os números rolados (na ordem dos grupos) em dados com faces. */
export function lerResultados(grupos: { lados: LadoAssim; qtd: number }[], resultados: number[]): DadoAssim[] {
  const out: DadoAssim[] = []; let i = 0
  for (const g of grupos) for (let k = 0; k < g.qtd; k++, i++) { const v = resultados[i] ?? 1; out.push({ lados: g.lados, valor: v, face: faceDe(g.lados, v) }) }
  return out
}

export const somar = (faces: Face[]): Face => faces.reduce((s, f) => F(s.a + f.a, s.b + f.b, s.c + f.c), VAZIA)

/** Sugestão de quais manter: mais Sucessos, depois mais Adaptações, depois menos Pressões. */
export function sugerirMantidos(dados: DadoAssim[], manter: number): number[] {
  const nota = (f: Face) => f.a * 100 + f.b * 10 - f.c * 15
  return dados.map((d, i) => ({ i, n: nota(d.face) })).sort((x, y) => y.n - x.n).slice(0, Math.min(manter, dados.length)).map(x => x.i).sort((a, b) => a - b)
}

/** Teste de Assimilação: 1d10 + 1d12 por Nível de Assimilação; todos os símbolos contam. */
export function montarTesteAssimilacao(nivelAssimilacao: number) {
  const n12 = Math.max(0, Math.floor(nivelAssimilacao) || 0)
  const grupos: { lados: LadoAssim; qtd: number }[] = [{ lados: 10, qtd: 1 }, ...(n12 ? [{ lados: 12 as LadoAssim, qtd: n12 }] : [])]
  return { grupos, expressao: grupos.map(g => `${g.qtd}d${g.lados}`).join('+') }
}

/** Penalidade da Saúde (Sucessos a menos): níveis 4–3 = 1; 2–1 = 2 (e pede Determinação para agir). */
export function penalidadeSaude(nivelAtual: number): { sucessos: number; determinacao: boolean } {
  if (nivelAtual >= 5) return { sucessos: 0, determinacao: false }
  if (nivelAtual >= 3) return { sucessos: 1, determinacao: false }
  return { sucessos: 2, determinacao: true }
}
/** Nível de Saúde atual: o mais alto que ainda tem pontos (0 = sem pontos em nenhum). */
export function nivelDeSaude(recursos: Record<string, { atual: number } | undefined>): number {
  for (let n = 6; n >= 1; n--) if ((Number(recursos['saude' + n]?.atual) || 0) > 0) return n
  return 0
}
