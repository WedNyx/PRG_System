/**
 * Verificações da ficha básica de Ordem Paranormal.
 * Apenas cálculos e validações objetivas — nenhum texto do livro é reproduzido.
 * Suplementos que alterem a progressão devem ter regras próprias, sem serem
 * silenciosamente confundidos com o modelo básico.
 */
export const NEX_ORDEM_BASICO = [...Array.from({ length: 19 }, (_, i) => (i + 1) * 5), 99] as const

export function nexOrdemBasicoValido(nex: number): boolean {
  return Number.isInteger(nex) && (nex === 99 || (nex >= 5 && nex <= 95 && nex % 5 === 0))
}

/** Os cinco atributos começam em 1, com quatro pontos adicionais na criação. */
export function limiteSomaAtributosOrdem(nex: number): number {
  return 9 + [20, 50, 80, 95].filter(marco => nex >= marco).length
}

export function somaAtributosOrdem(atributos: Record<string, number>): number {
  return ['AGI', 'FOR', 'INT', 'PRE', 'VIG'].reduce((soma, id) => soma + (Number(atributos[id]) || 0), 0)
}

/** Apenas a visualização dos cinco atributos — nomes estáveis preservam fichas antigas. */
export const POSICOES_HEXAGONOS_ORDEM: Record<string, string> = {
  AGI: 'col-start-2 row-start-1',
  FOR: 'col-start-1 row-start-2',
  INT: 'col-start-3 row-start-2',
  PRE: 'col-start-1 row-start-3',
  VIG: 'col-start-3 row-start-3',
}
