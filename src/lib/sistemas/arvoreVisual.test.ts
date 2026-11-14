import { describe, expect, it } from 'vitest'
import { ordenarNosVerticais } from './arvoreVisual'

describe('Árvore vertical: apresentação sem modificar a ficha', () => {
  it('apresenta marcos de nível em sequência estável sem alterar o array original', () => {
    const nos = [{ id: 'n5', nivel: 5 }, { id: 'n1', nivel: 1 }, { id: 'n3', nivel: 3 }]
    const antes = JSON.stringify(nos)
    expect(ordenarNosVerticais(nos).map(n => n.id)).toEqual(['n1', 'n3', 'n5'])
    expect(JSON.stringify(nos)).toBe(antes)
  })
  it('mostra pré-requisitos antes do poder dependente, sem mudar as concessões', () => {
    const nos = [
      { id: 'final', nome: 'Especial', nivel: 1, requer: ['medio'] },
      { id: 'medio', nome: 'Intermediário', nivel: 1, requer: ['inicio'] },
      { id: 'inicio', nome: 'Início', nivel: 2, requer: [] },
    ]
    expect(ordenarNosVerticais(nos).map(n => n.id)).toEqual(['inicio', 'medio', 'final'])
  })
  it('não trava com requisitos inexistentes ou ciclos de dados legados', () => {
    const nos = [{ id: 'a', requer: ['b'] }, { id: 'b', requer: ['a', 'inexistente'] }]
    const ordenados = ordenarNosVerticais(nos)
    expect(new Set(ordenados.map(n => n.id))).toEqual(new Set(['a', 'b']))
    expect(ordenados).toHaveLength(2)
  })
})
