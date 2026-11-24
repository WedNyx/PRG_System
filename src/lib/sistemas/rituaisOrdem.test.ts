import { describe, expect, it } from 'vitest'
import { CUSTO_CIRCULO, RITUAIS_ORDEM, contarRituais } from './rituaisOrdem'
import { ELEMENTOS_ORDEM } from './inventario'

describe('Grimório da Ordem (v0.36.9)', () => {
  it('todos os elementos, sem ritual repetido no mesmo elemento', () => {
    const c = contarRituais()
    for (const e of ELEMENTOS_ORDEM) expect(c[e], e).toBeGreaterThan(0)
    expect(RITUAIS_ORDEM.length).toBeGreaterThanOrEqual(70)
    expect(new Set(RITUAIS_ORDEM.map(r => r.elemento + '|' + r.nome)).size).toBe(RITUAIS_ORDEM.length)
    expect(RITUAIS_ORDEM.filter(r => r.nome === 'Amaldiçoar Arma').map(r => r.elemento).sort()).toEqual(['Conhecimento', 'Energia', 'Morte', 'Sangue'])
  })
  it('custo por círculo e resumo curto, sem texto nem página do livro', () => {
    expect(CUSTO_CIRCULO).toEqual([0, 1, 3, 6, 10])
    for (const r of RITUAIS_ORDEM) {
      expect([1, 2, 3, 4]).toContain(r.circulo)
      expect(r.resumo.length, r.nome).toBeLessThan(120)
      expect(/livro de regras|p\. ?\d/i.test(r.resumo), r.nome).toBe(false)
    }
  })
})
