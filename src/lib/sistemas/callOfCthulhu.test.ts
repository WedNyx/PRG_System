import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { fichaVazia, tornarManual } from './calculo'
import { leituraCoc } from './combate'

describe('Call of Cthulhu 7ª (estrutura, v0.35.7)', () => {
  const s = sistemaPorId('call-of-cthulhu')!
  it('ficha nova: características, perícias com o valor-base e recursos', () => {
    expect(s.tipo).toBe('estrutura')
    expect(s.atributos.map(a => a.id)).toEqual(['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'])
    const d = tornarManual(s, fichaVazia(s))
    expect(d.pericias.esquivar).toBe(25) // DES 50 ÷ 2
    expect(d.pericias.idioma_nativo).toBe(50) // EDU
    expect(d.pericias.mitos_de_cthulhu).toBe(0)
    expect(d.pericias.primeiros_socorros).toBe(30)
    expect(d.recursos.pv.max).toBe(10) // (50 + 50) ÷ 10
    expect(d.recursos.pm.max).toBe(10)
    expect(new Set(s.pericias!.lista.map(p => p.id)).size).toBe(s.pericias!.lista.length)
  })
  it('leitura do d100: crítico, extremo, difícil, sucesso, falha e desastre', () => {
    expect(leituraCoc(60, 1)).toMatch(/Crítico/)
    expect(leituraCoc(60, 12)).toMatch(/extremo/)
    expect(leituraCoc(60, 30)).toMatch(/difícil/)
    expect(leituraCoc(60, 60)).toMatch(/^✅ Sucesso$/)
    expect(leituraCoc(60, 61)).toMatch(/Falha/)
    expect(leituraCoc(60, 99)).toMatch(/Falha/)
    expect(leituraCoc(60, 100)).toMatch(/Desastre/)
    expect(leituraCoc(40, 96)).toMatch(/Desastre/)
  })
})
