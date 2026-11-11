import { describe, expect, it } from 'vitest'
import { GRUPOS_PRONTOS, PRONTOS } from './bibliotecaPronta'
import { normalizarItem, normalizarPoder } from './sistemas/inventario'

describe('biblioteca pronta', () => {
  it('todos os prontos são válidos e mantêm arte, raridade e rolagem', () => {
    for (const p of PRONTOS) {
      const v = p.tipo === 'item' ? normalizarItem({ ...p.dados, id: 'x' }) : normalizarPoder({ ...p.dados, id: 'x' })
      expect(v, p.dados.nome).not.toBeNull()
      expect({ ...v, id: undefined }).toMatchObject({ ...p.dados, id: undefined })
    }
  })
  it('nomes únicos e cada um num grupo que existe', () => {
    expect(new Set(PRONTOS.map(p => p.tipo + p.dados.nome)).size).toBe(PRONTOS.length)
    for (const p of PRONTOS) expect(GRUPOS_PRONTOS.some(g => g.id === p.grupo)).toBe(true)
  })
})
