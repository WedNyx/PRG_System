/**
 * Histórico de rolagens (v0.32.5): filtros e resumo da sessão. Funções puras (historico.test.ts).
 */
import { detectarCritico } from './dice'

export type EventoResumo = {
  tipo: string; personagem: string | null; autor_id: string | null; expressao: string | null; resultados: number[] | null; total: number | null
  dados?: { dano?: { total?: number } | null; critico?: boolean; acerto?: boolean; alvo?: { nome?: string } } | null; criado_em: string
}
export type Periodo = 'sessao' | 'hoje' | 'semana' | 'tudo'
export type FiltroResultado = '' | 'critico' | 'falha'

/** Data inicial do período (ISO) ou null para “tudo”. */
export function inicioDoPeriodo(p: Periodo, agora: Date, sessaoAbertaEm?: string | null): string | null {
  if (p === 'sessao') return sessaoAbertaEm ?? new Date(agora.getTime() - 12 * 3600_000).toISOString()
  if (p === 'hoje') { const d = new Date(agora); d.setHours(0, 0, 0, 0); return d.toISOString() }
  if (p === 'semana') return new Date(agora.getTime() - 7 * 86_400_000).toISOString()
  return null
}

/** Filtros do PostgREST para crítico/falha num d20 (aproximado: tem d20 na expressão e um 20 ou um 1 nos dados). */
export function filtroResultado(r: FiltroResultado): string[] {
  if (r === 'critico') return ['expressao=ilike.*d20*', 'resultados=cs.{20}']
  if (r === 'falha') return ['expressao=ilike.*d20*', 'resultados=cs.{1}']
  return []
}

export type Resumo = {
  rolagens: number; ataques: number; acertos: number; criticos: number; falhas: number
  maiorDano: { valor: number; quem: string; alvo: string } | null
  maiorRolagem: { valor: number; quem: string; expressao: string } | null
  porPersonagem: { nome: string; rolagens: number; mediaD20: number | null; criticos: number; falhas: number }[]
}

export function resumirRolagens(evs: EventoResumo[], nomeDoAutor: (id: string | null) => string = () => 'Alguém'): Resumo {
  const r: Resumo = { rolagens: 0, ataques: 0, acertos: 0, criticos: 0, falhas: 0, maiorDano: null, maiorRolagem: null, porPersonagem: [] }
  const pp = new Map<string, { nome: string; rolagens: number; somaD20: number; qtdD20: number; criticos: number; falhas: number }>()
  for (const e of evs) {
    if (e.tipo !== 'rolagem' && e.tipo !== 'ataque') continue
    const quem = e.personagem || nomeDoAutor(e.autor_id)
    const p = pp.get(quem) ?? { nome: quem, rolagens: 0, somaD20: 0, qtdD20: 0, criticos: 0, falhas: 0 }
    p.rolagens++
    if (e.tipo === 'rolagem') r.rolagens++
    else { r.ataques++; if (e.dados?.acerto) r.acertos++ }
    const res = e.resultados ?? [], expr = e.expressao ?? ''
    const c = expr ? detectarCritico(expr, res) : null
    if (c === 'critico') { r.criticos++; p.criticos++ }
    if (c === 'falha') { r.falhas++; p.falhas++ }
    if (/d20/i.test(expr) && res.length) { p.somaD20 += res[0]; p.qtdD20++ }
    if (e.tipo === 'rolagem' && typeof e.total === 'number' && (!r.maiorRolagem || e.total > r.maiorRolagem.valor)) r.maiorRolagem = { valor: e.total, quem, expressao: expr }
    const dano = e.dados?.dano?.total
    if (e.tipo === 'ataque' && e.dados?.acerto && typeof dano === 'number' && (!r.maiorDano || dano > r.maiorDano.valor)) r.maiorDano = { valor: dano, quem, alvo: e.dados?.alvo?.nome ?? '' }
    pp.set(quem, p)
  }
  r.porPersonagem = [...pp.values()].map(p => ({ nome: p.nome, rolagens: p.rolagens, criticos: p.criticos, falhas: p.falhas, mediaD20: p.qtdD20 ? Math.round((p.somaD20 / p.qtdD20) * 10) / 10 : null }))
    .sort((a, b) => b.rolagens - a.rolagens)
  return r
}
