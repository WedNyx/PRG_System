import { describe, expect, it } from 'vitest'
import type { Parede } from './paredes'
import { alcanceCelulas, alcanceDoToken, celulasVisiveis, estaEscuro, iluminado, normalizarVisao, dentroDoPoligono, poligonoVisao, revelarNaNevoa, segmentosVisao, temLinhaDeVisao } from './visao'
import { expandirNevoa } from '../nuvem/mesa'

const P = (x1: number, y1: number, x2: number, y2: number, tipo: Parede['tipo'] = 'parede', extra: Partial<Parede> = {}): Parede => ({ id: `p${x1}${y1}${x2}${y2}${tipo}`, x1, y1, x2, y2, tipo, ...extra })
// Sala de (2,2) a (6,6) com porta no lado direito (y 3–4) e janela embaixo (x 3–5).
const sala = (porta: Partial<Parede> = {}) => [P(2, 2, 6, 2), P(2, 2, 2, 6), P(2, 6, 3, 6), P(3, 6, 5, 6, 'janela'), P(5, 6, 6, 6), P(6, 2, 6, 3), P(6, 3, 6, 4, 'porta', porta), P(6, 4, 6, 6)]

describe('visão e luz com paredes (v0.35.0)', () => {
  it('parede e porta fechada bloqueiam a visão; janela e porta aberta deixam ver', () => {
    expect(segmentosVisao(sala()).length).toBe(7)
    expect(segmentosVisao(sala({ aberta: true })).length).toBe(6)
  })

  it('de fora da sala não se vê dentro; pela janela, sim', () => {
    const segs = segmentosVisao(sala())
    expect(temLinhaDeVisao(8.5, 3.5, 4.5, 3.5, segs)).toBe(false) // porta fechada no caminho
    expect(temLinhaDeVisao(4.5, 8.5, 4.5, 4.5, segs)).toBe(true) // pela janela
    expect(temLinhaDeVisao(8.5, 3.5, 4.5, 3.5, segmentosVisao(sala({ aberta: true })))).toBe(true)
  })

  it('células visíveis param na parede', () => {
    const vis = new Set(celulasVisiveis(8.5, 3.5, segmentosVisao(sala()), 12, 12, 20))
    expect(vis.has('9,3') && vis.has('7,3')).toBe(true)
    expect(vis.has('4,4')).toBe(false)
    const dentro = new Set(celulasVisiveis(4.5, 4.5, segmentosVisao(sala()), 12, 12, 20))
    expect(dentro.has('3,3') && dentro.has('5,5')).toBe(true)
    expect(dentro.has('9,3')).toBe(false)
    expect(dentro.has('4,8')).toBe(true) // pela janela
  })

  it('o alcance limita o que se vê', () => {
    const vis = celulasVisiveis(0.5, 0.5, [], 30, 30, 3)
    expect(vis).toContain('2,2')
    expect(vis).not.toContain('5,0')
    expect(alcanceCelulas(9)).toBe(6)
    expect(alcanceCelulas(0)).toBe(60)
  })

  it('polígono de visão: dentro da sala fechada não vaza para fora', () => {
    const pol = poligonoVisao(4.5, 4.5, segmentosVisao(sala()).filter(s => !(s[1] === 6 && s[3] === 6)).concat([[2, 6, 6, 6]]), 12, 12)
    expect(dentroDoPoligono(3.5, 3.5, pol)).toBe(true)
    expect(dentroDoPoligono(9.5, 9.5, pol)).toBe(false)
    const livre = poligonoVisao(5.5, 5.5, [], 12, 12)
    expect(dentroDoPoligono(11.5, 0.5, livre)).toBe(true)
  })

  it('revelar junta células sem perder as que já estavam', () => {
    const r = revelarNaNevoa(['0-2,0'], ['5,5', '1,0'], 10, 10)
    expect(r.mudou).toBe(true)
    expect([...expandirNevoa(r.nevoa)].sort()).toEqual(['0,0', '1,0', '2,0', '5,5'])
    expect(revelarNaNevoa(['0-2,0'], ['1,0'], 10, 10).mudou).toBe(false)
  })

  it('visão de cada personagem (v0.35.2)', () => {
    expect(normalizarVisao({ alcance: 18, escuro: 500 })).toEqual({ alcance: 18, escuro: 300 })
    expect(normalizarVisao({ alcance: 0, escuro: 0 })).toBeNull()
    expect(alcanceDoToken({ alcance: 9, escuro: 0 }, 60)).toBe(6)
    expect(alcanceDoToken(null, 9)).toBe(6)
    expect(estaEscuro(49)).toBe(false)
    expect(estaEscuro(50)).toBe(true)
  })

  it('no escuro só se vê o que está iluminado ou dentro da visão no escuro', () => {
    const sem = new Set(celulasVisiveis(0.5, 0.5, [], 20, 20, 30, { visao: 0, luzes: [] }))
    expect([...sem]).toEqual(['0,0']) // só a própria casa
    const elfo = new Set(celulasVisiveis(0.5, 0.5, [], 20, 20, 30, { visao: 4, luzes: [] }))
    expect(elfo.has('3,0') && !elfo.has('6,0')).toBe(true)
    const tocha = new Set(celulasVisiveis(0.5, 0.5, [], 20, 20, 30, { visao: 0, luzes: [{ x: 10.5, y: 0.5, raio: 2 }] }))
    expect(tocha.has('10,0') && tocha.has('11,0') && !tocha.has('5,0')).toBe(true)
  })

  it('a luz não atravessa parede', () => {
    const segs = segmentosVisao([P(5, 0, 5, 10)])
    expect(iluminado(4.5, 0.5, [{ x: 6.5, y: 0.5, raio: 4 }], segs)).toBe(false)
    expect(iluminado(7.5, 0.5, [{ x: 6.5, y: 0.5, raio: 4 }], segs)).toBe(true)
  })
})
