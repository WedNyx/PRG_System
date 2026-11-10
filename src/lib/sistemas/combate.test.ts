import { describe, expect, it } from 'vitest'
import { acertou, aplicarNaVida, distancia, gastarCusto, regraDeAtaque, resumoCombate } from './combate'
import { sistemaPorId } from './catalogo'
import type { Sistema } from './tipos'

describe('combate na mesa', () => {
  const dnd = sistemaPorId('dnd5e-srd')!
  it('lê vida, defesa, armas, poderes e o teste de ataque de uma ficha D&D', () => {
    const r = resumoCombate(dnd, {
      nome: 'Thorin', atributos: { FOR: 16, DES: 12 }, recursos: { pv: { atual: 9, max: 12 }, },
      itens: [{ id: 'esp', nome: 'Espada', categoria: 'arma', peso: 1, dano: '1d8+3', bonus: [] }, { id: 'arco', nome: 'Arco', categoria: 'arma', peso: 1, dano: '1d6', alcance: 24, bonus: [] }, { id: 'x', nome: 'Corda', categoria: 'equipamento', peso: 1, bonus: [] }],
      poderes: [{ id: 'm', nome: 'Raio', tipo: 'magia', expressao: '2d6', recurso: 'pv_temp', custo: 1, alcance: 18 }],
    })
    expect(r.vida).toMatchObject({ id: 'pv', atual: 9, max: 12 })
    expect(r.defesa?.valor).toBeGreaterThanOrEqual(10)
    expect(r.ataques.map(a => [a.nome, a.alcance])).toEqual([['Espada', 1.5], ['Arco', 24], ['Raio', 18]])
    expect(r.ataques[2]).toMatchObject({ recurso: 'pv_temp', custo: 1 })
    expect(r.testePadrao).toBe('pericia:atletismo')
  })
  it('regra de ataque por sistema', () => {
    expect(regraDeAtaque(dnd, 5)).toEqual({ expressao: '1d20+5', comparar: 'maior_igual' })
    expect(regraDeAtaque(dnd, -1).expressao).toBe('1d20-1')
    expect(regraDeAtaque(sistemaPorId('brp'), 45)).toEqual({ expressao: '1d100', comparar: 'menor_igual' })
    const pool = { ...dnd, rolagem: 'personalizada', regraRolagem: { nome: 'Sucessos', formula: 'VALORd6s5' } } as Sistema
    expect(regraDeAtaque(pool, 4)).toEqual({ expressao: '4d6s5', comparar: 'sucessos' })
  })
  it('acerto', () => {
    expect(acertou({ expressao: '', comparar: 'maior_igual' }, 13, 13, 0)).toBe(true)
    expect(acertou({ expressao: '', comparar: 'maior_igual' }, 12, 13, 0)).toBe(false)
    expect(acertou({ expressao: '', comparar: 'menor_igual' }, 40, 0, 45)).toBe(true)
    expect(acertou({ expressao: '', comparar: 'sucessos' }, 1, 0, 0)).toBe(true)
    expect(acertou({ expressao: '', comparar: 'sucessos' }, 0, 0, 0)).toBe(false)
  })
  it('distância igual à régua', () => {
    expect(distancia({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(1.5)
    expect(distancia({ x: 0, y: 0 }, { x: 4, y: 2 })).toBe(6)
  })
  it('vida e custo', () => {
    expect(aplicarNaVida({ recursos: { pv: { atual: 9 } } }, 'pv', 12, 12)).toEqual({ recursos: { pv: { atual: 0 } } })
    expect(aplicarNaVida({ recursos: { pv: { atual: 9 } } }, 'pv', -10, 12)).toEqual({ recursos: { pv: { atual: 12 } } })
    expect(gastarCusto({ recursos: { pm: { atual: 2 } } }, 'pm', 3)).toBeNull()
    expect(gastarCusto({ recursos: { pm: { atual: 5 } } }, 'pm', 3)).toEqual({ recursos: { pm: { atual: 2 } } })
  })
})
