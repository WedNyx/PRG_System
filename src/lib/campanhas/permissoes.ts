export type Modelo = 'A' | 'B' | 'C'
export type Regra = 'livre' | 'aprovacao' | 'mestre'
export type Campo = 'identidade' | 'pv' | 'anotacoes' | 'atributos' | 'pericias' | 'habilidades' | 'equipamentos' | 'nivel'
export type Permissoes = Record<Campo, Regra>
export const CAMPOS: { id: Campo; titulo: string }[] = [
  { id: 'identidade', titulo: 'Identidade, aparência e história' },
  { id: 'pv', titulo: 'PV e recursos' },
  { id: 'anotacoes', titulo: 'Anotações' },
  { id: 'atributos', titulo: 'Atributos' },
  { id: 'pericias', titulo: 'Perícias' },
  { id: 'habilidades', titulo: 'Habilidades e poderes' },
  { id: 'equipamentos', titulo: 'Armas e equipamentos' },
  { id: 'nivel', titulo: 'Nível e evolução' },
]
export const REGRAS: { id: Regra; titulo: string }[] = [
  { id: 'livre', titulo: 'Livre' },
  { id: 'aprovacao', titulo: 'Com aprovação' },
  { id: 'mestre', titulo: 'Somente mestre' },
]
export function permissoesPadrao(modelo: Modelo): Permissoes {
  const comum: Permissoes = { identidade: 'livre', pv: 'livre', anotacoes: 'livre', atributos: 'aprovacao', pericias: 'aprovacao', habilidades: 'aprovacao', equipamentos: 'aprovacao', nivel: 'aprovacao' }
  if (modelo === 'A') return { ...comum, atributos: 'livre', pericias: 'livre', habilidades: 'livre', equipamentos: 'livre', nivel: 'livre' }
  if (modelo === 'B') return { identidade: 'mestre', pv: 'mestre', anotacoes: 'mestre', atributos: 'mestre', pericias: 'mestre', habilidades: 'mestre', equipamentos: 'mestre', nivel: 'mestre' }
  return comum
}
export function regraEfetiva(padrao: Permissoes, excecao: Partial<Permissoes> | undefined, campo: Campo): Regra {
  return excecao?.[campo] ?? padrao[campo]
}
