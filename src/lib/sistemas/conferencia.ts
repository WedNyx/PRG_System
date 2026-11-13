/**
 * Conferência da ficha para os sistemas genéricos (v0.33.6): o que falta escolher, limites da criação
 * passados e PV/recursos sem máximo. O D&D 2024 tem uma conferência própria (dnd2024Mestre.ts).
 */
import type { DadosFicha, Sistema } from './tipos'
import type { Calculo } from './calculo'
import { opcaoEscolhida } from './calculo'

export type ItemConferencia = { tipo: 'ok' | 'aviso' | 'erro'; texto: string; aba?: 'principal' | 'atributos' | 'habilidades' | 'arvore' | 'equipamentos' }
/** Campos de escolha opcionais (não pedem preenchimento). */
const OPCIONAL = /opcional|^armadura|carga|tipo/i

export function conferirFichaGenerica(s: Sistema, d: DadosFicha, c: Pick<Calculo, 'limites' | 'recursosMax' | 'derivados'>): ItemConferencia[] {
  const out: ItemConferencia[] = []
  if (!d.nome?.trim()) out.push({ tipo: 'aviso', texto: 'Dê um nome ao personagem.', aba: 'principal' })
  for (const f of s.campos) {
    if (f.tipo !== 'escolha' || OPCIONAL.test(f.nome) || OPCIONAL.test(f.id) || f.opcoes?.some(o => /^(não|nenhum|sem)\b/i.test(o.nome))) continue
    const v = d.campos[f.id]
    if (!opcaoEscolhida(f, v) && !(typeof v === 'string' && v.trim())) out.push({ tipo: 'erro', texto: `Escolha: ${f.nome.split(' (')[0]}.`, aba: 'principal' })
  }
  if (s.atributos.length && s.atributos.every(a => (Number(d.atributos[a.id]) || 0) === a.padrao))
    out.push({ tipo: 'aviso', texto: 'Os atributos ainda estão todos no valor inicial: distribua como o livro manda.', aba: 'atributos' })
  for (const l of c.limites) if (l.excedido) out.push({ tipo: 'erro', texto: `${l.nome}: ${l.uso} de ${l.max}.`, aba: 'atributos' })
  for (const r of s.recursos) {
    if (!/^(pv|vida|saude)/i.test(r.id) || r.contador) continue
    const max = Number(d.recursos[r.id]?.max ?? c.recursosMax[r.id]) || 0
    if (!max && !r.ocultarSemMax) out.push({ tipo: 'aviso', texto: `${r.nome}: máximo ainda em 0. ${r.sugerido || r.formula ? 'Escolha a classe (ou o que dá os PV) na aba Principal.' : 'Anote o máximo na barra.'}`, aba: 'principal' })
  }
  if (!out.some(x => x.tipo !== 'ok')) out.push({ tipo: 'ok', texto: 'Tudo certo para jogar.' })
  return out
}
