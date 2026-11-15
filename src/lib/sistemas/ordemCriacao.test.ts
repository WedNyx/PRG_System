import { describe, expect, it } from 'vitest'
import { fichaVazia, calcular } from './calculo'
import { sistemaPorId } from './catalogo'
import { NEX_ORDEM_BASICO, nexOrdemBasicoValido, limiteSomaAtributosOrdem, somaAtributosOrdem, POSICOES_HEXAGONOS_ORDEM } from './ordemCriacao'

describe('Ordem Paranormal — criação e progressão do modelo básico', () => {
  it('aceita marcos regulares de 5% a 95% e NEX 99%', () => {
    expect(NEX_ORDEM_BASICO).toHaveLength(20)
    for (const nex of NEX_ORDEM_BASICO) expect(nexOrdemBasicoValido(nex)).toBe(true)
    for (const nex of [0, 1, 7, 17, 96, 98, 100, NaN]) expect(nexOrdemBasicoValido(nex)).toBe(false)
  })

  it('conta os cinco atributos e os marcos de distribuição', () => {
    expect(somaAtributosOrdem({ AGI: 3, FOR: 2, INT: 1, PRE: 1, VIG: 2 })).toBe(9)
    expect(limiteSomaAtributosOrdem(5)).toBe(9)
    expect(limiteSomaAtributosOrdem(20)).toBe(10)
    expect(limiteSomaAtributosOrdem(50)).toBe(11)
    expect(limiteSomaAtributosOrdem(80)).toBe(12)
    expect(limiteSomaAtributosOrdem(95)).toBe(13)
    expect(limiteSomaAtributosOrdem(99)).toBe(13)
  })

  it('mantém os cinco atributos em posições únicas do anel', () => {
    expect(Object.keys(POSICOES_HEXAGONOS_ORDEM).sort()).toEqual(['AGI', 'FOR', 'INT', 'PRE', 'VIG'])
    expect(new Set(Object.values(POSICOES_HEXAGONOS_ORDEM)).size).toBe(5)
  })

  it('calcula PV, PE, Sanidade, Defesa e DT em NEX 10% para Combatente', () => {
    const s = sistemaPorId('ordem-paranormal')!
    const d = fichaVazia(s)
    d.campos.classe = 'Combatente'
    d.campos.nex = 10
    Object.assign(d.atributos, { AGI: 2, FOR: 1, INT: 1, PRE: 2, VIG: 3 })
    const c = calcular(s, d)
    expect(c.derivados.nivel).toBe(2)
    expect(c.derivados.pv_max).toBe(30)
    expect(c.derivados.pe_max).toBe(8)
    expect(c.derivados.san_max).toBe(15)
    expect(c.derivados.defesa).toBe(12)
    expect(c.derivados.dt_rituais).toBe(14)
  })
})
