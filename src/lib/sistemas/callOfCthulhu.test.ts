import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { fichaVazia, tornarManual } from './calculo'
import { aplicarDescanso } from './descanso'
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
    // Sanidade começa igual ao POD (50), não no máximo (99); Sorte, sem fórmula, começa no máximo mesmo.
    expect(d.recursos.sanidade).toEqual({ atual: 50, max: 99 })
    expect(d.recursos.sorte).toEqual({ atual: 99, max: 99 })
    expect(new Set(s.pericias!.lista.map(p => p.id)).size).toBe(s.pericias!.lista.length)
  })
  it('descanso longo não enche Sanidade nem Sorte (a perda é permanente até as regras do livro)', () => {
    const d = tornarManual(s, fichaVazia(s))
    d.recursos.sanidade = { ...d.recursos.sanidade, atual: 20 }
    d.recursos.sorte = { ...d.recursos.sorte, atual: 10 }
    const { d: depois } = aplicarDescanso(s, d, 'longo')
    expect(depois.recursos.sanidade.atual).toBe(20)
    expect(depois.recursos.sorte.atual).toBe(10)
    expect(depois.recursos.pv.atual).toBe(10) // PV continua enchendo normalmente
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
