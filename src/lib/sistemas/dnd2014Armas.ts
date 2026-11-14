/**
 * Armas principais do PHB 2014 / SRD 5.1, SEM maestrias de 2024.
 * Tabela de equipamento: https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment
 * SRD 5.1 distribuído sob CC BY 4.0: https://www.dndbeyond.com/srd
 *
 * Os ids têm prefixo 2014 para não confundir rolagens de edições diferentes
 * em inventários já salvos. O tipo reutiliza os campos comuns do catálogo 2024.
 */
import { ARMAS_DND_2024, armaDndPorId, type ArmaDnd2024 } from './dnd2024Armas'

/** Ajustes verificados na tabela 2014: sem maestria, sem armas de fogo na tabela PHB,
 * lança montada e tridente com dados diferentes; rede no lugar de armas de fogo.
 */
const alteracoes: Record<string, Partial<ArmaDnd2024>> = {
  'lanca-cavalaria': { dano: '1d12', propriedades: ['Alcance', 'Especial'], preco: '10 PO', pesoLb: 6 },
  tridente: { dano: '1d6', versatil: '1d8', preco: '5 PO', pesoLb: 4 },
  'picareta-guerra': { preco: '5 PO', propriedades: [] },
}
const sem2024 = new Set(['mosquete', 'pistola'])
export const ARMAS_DND_2014: ArmaDnd2024[] = [
  ...ARMAS_DND_2024.filter(a => !sem2024.has(a.id)).map(a => ({
    ...a, ...alteracoes[a.id], id: '2014-' + a.id, maestria: '',
    propriedades: alteracoes[a.id]?.propriedades ?? [...a.propriedades],
  })),
  { id: '2014-rede', nome: 'Rede', grupo: 'marcial-distancia', dano: '',
    tipo: 'Contundente', propriedades: ['Especial', 'Arremesso'], maestria: '',
    pesoLb: 3, preco: '1 PO', alcancePes: [5, 15] },
]
/** Os dois arsenais coexistem; rolar uma arma antiga não usa os valores 2024. */
export const armaDndPorIdEdicao = (id: unknown): ArmaDnd2024 | null => {
  if (typeof id !== 'string') return null
  if (id.startsWith('2014-')) return ARMAS_DND_2014.find(a => a.id === id) ?? null
  return armaDndPorId(id)
}
export const descricaoArma2014 = (a: ArmaDnd2024): string =>
  a.id === '2014-rede'
    ? 'D&D 2014 · Rede especial: não causa dano. Ataque de arremesso (5/15 pés); a condição e a libertação seguem o PHB 2014.'
    : `D&D 2014 · ${a.tipo} · ${a.propriedades.join(', ') || 'Sem propriedades'}${a.alcancePes ? ` · Alcance ${a.alcancePes.join('/')} pés` : ''}${a.versatil ? ` · Versátil ${a.versatil}` : ''} · ${a.preco}. Sem Maestria de Armas (regra de 2024).`
