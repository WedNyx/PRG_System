import { describe, expect, it } from 'vitest'
import { atravessaParede, caminhoLivre, cruzam, distanciaParede, lerParedes, normalizarParede, passosBloqueados, segmentosDaForma, MAX_PAREDES_PEDIDO, type Parede } from './paredes'

const P = (x1: number, y1: number, x2: number, y2: number, tipo: Parede['tipo'] = 'parede', extra: Partial<Parede> = {}): Parede => ({ id: 'p-' + x1 + y1 + x2 + y2 + tipo, x1, y1, x2, y2, tipo, ...extra })
// Sala fechada de (2,2) a (6,6): o lado direito tem uma porta entre y=3 e y=4.
const sala = (porta: Partial<Parede> = {}) => [P(2, 2, 6, 2), P(2, 2, 2, 6), P(2, 6, 6, 6), P(6, 2, 6, 3), P(6, 3, 6, 4, 'porta', porta), P(6, 4, 6, 6)]

describe('paredes e portas (v0.34.10)', () => {
  it('cruzamento de segmentos', () => {
    expect(cruzam(0, 0, 2, 2, 0, 2, 2, 0)).toBe(true)
    expect(cruzam(0, 0, 1, 0, 0, 1, 1, 1)).toBe(false)
    expect(cruzam(0, 0, 2, 0, 1, 0, 1, 3)).toBe(true) // encosta
  })

  it('parede vertical bloqueia só as linhas que cobre', () => {
    const b = passosBloqueados([P(3, 0, 3, 2)], 10, 10)
    expect(b.has('h:2,0') && b.has('h:2,1')).toBe(true)
    expect(b.has('h:2,2')).toBe(false)
  })

  it('não entra na sala fechada; com a porta aberta entra', () => {
    expect(caminhoLivre(sala(), 10, 10, { x: 8, y: 3 }, { x: 4, y: 3 })).toBe(false)
    expect(caminhoLivre(sala({ aberta: true }), 10, 10, { x: 8, y: 3 }, { x: 4, y: 3 })).toBe(true)
    expect(caminhoLivre(sala(), 10, 10, { x: 3, y: 3 }, { x: 5, y: 5 })).toBe(true) // dentro da sala anda à vontade
    expect(caminhoLivre(sala(), 10, 10, { x: 0, y: 0 }, { x: 9, y: 0 })).toBe(true) // por fora, sem cruzar
    // v0.35.4: anda em linha reta; não “pula” a sala só porque existe um caminho em volta.
    expect(caminhoLivre(sala(), 10, 10, { x: 0, y: 0 }, { x: 9, y: 9 })).toBe(false)
  })

  it('janela também bloqueia a passagem', () => {
    const s = sala().map(p => p.tipo === 'porta' ? { ...p, tipo: 'janela' as const } : p)
    expect(caminhoLivre(s, 10, 10, { x: 8, y: 3 }, { x: 4, y: 3 })).toBe(false)
  })

  it('token grande não passa por porta de uma célula', () => {
    expect(caminhoLivre(sala({ aberta: true }), 10, 10, { x: 7, y: 3 }, { x: 3, y: 3 }, 2)).toBe(false)
    expect(caminhoLivre(sala({ aberta: true }), 10, 10, { x: 7, y: 3 }, { x: 3, y: 3 }, 1)).toBe(true)
  })

  it('não escapa pela quina entre duas paredes', () => {
    // Quina fechada em (5,5): parede para cima e para a esquerda.
    const quina = [P(5, 0, 5, 5), P(0, 5, 5, 5)]
    expect(caminhoLivre(quina, 10, 10, { x: 4, y: 4 }, { x: 5, y: 5 })).toBe(false)
  })

  it('valida o que vem do navegador', () => {
    expect(normalizarParede({ x1: 0, y1: 0, x2: 0, y2: 0 }, 10, 10)).toBeNull()
    expect(normalizarParede({ x1: 0, y1: 0, x2: 11, y2: 0 }, 10, 10)).toBeNull()
    expect(normalizarParede({ x1: 0.523, y1: 0, x2: 2, y2: 0 }, 10, 10)).toMatchObject({ x1: 0.52 }) // v0.35.4: ponta livre
    expect(normalizarParede({ x1: 1, y1: 1, x2: 1.01, y2: 1 }, 10, 10)).toBeNull()
    expect(normalizarParede({ x1: 0, y1: 0, x2: 2, y2: 0, grupo: 'abcd1234-x' }, 10, 10)).toMatchObject({ grupo: 'abcd1234-x' })
    expect(normalizarParede({ x1: 0, y1: 0, x2: 2, y2: 0, grupo: '<script>' }, 10, 10)?.grupo).toBeUndefined()
    expect(normalizarParede({ x1: 0, y1: 0, x2: 2, y2: 0, tipo: 'porta', aberta: true }, 10, 10)).toMatchObject({ tipo: 'porta', aberta: true, trancada: false })
    expect(lerParedes([{ x1: 0, y1: 0, x2: 2, y2: 0 }, 'lixo'], 10, 10)).toHaveLength(1)
    expect(distanciaParede(P(0, 0, 4, 0), 2, 1)).toBeCloseTo(1)
  })
})

describe('paredes que travam de verdade e formas (v0.35.4)', () => {
  // Pedaços soltos de parede (como em volta de caixotes): antes o token passava “pulando” pelo lado.
  const caixote = [P(3, 2, 3, 6), P(3, 6, 5, 6)]
  it('a parede solta bloqueia quem tenta passar por ela', () => {
    expect(caminhoLivre(caixote, 10, 10, { x: 1, y: 3 }, { x: 5, y: 3 })).toBe(false)
    expect(caminhoLivre(caixote, 10, 10, { x: 1, y: 1 }, { x: 5, y: 1 })).toBe(true) // por cima da parede, livre
  })
  it('encostar na ponta não bloqueia; passar pela quina fechada bloqueia', () => {
    expect(atravessaParede([P(2, 0, 2, 2)], 1, 2, 3, 2)).toBe(false) // ponta da parede, com o caminho só tocando
    expect(atravessaParede([P(5, 0, 5, 5), P(0, 5, 5, 5)], 4.5, 4.5, 5.5, 5.5)).toBe(true)
    expect(atravessaParede([P(5, 5, 5, 9), P(5, 5, 9, 5)], 4.5, 4.5, 5.5, 4.5)).toBe(false) // passa por fora da quina
  })
  it('parede fora da grade (desenho livre) também bloqueia', () => {
    const torta: Parede = { id: 'torta-1234', x1: 2.3, y1: 0.4, x2: 3.7, y2: 8.9, tipo: 'parede' }
    expect(caminhoLivre([torta], 10, 10, { x: 0, y: 4 }, { x: 6, y: 4 })).toBe(false)
    expect(caminhoLivre([{ ...torta, tipo: 'janela' }], 10, 10, { x: 0, y: 4 }, { x: 6, y: 4 })).toBe(false)
    expect(caminhoLivre([{ ...torta, tipo: 'porta', aberta: true }], 10, 10, { x: 0, y: 4 }, { x: 6, y: 4 })).toBe(true)
  })
  it('não para em cima da parede', () => {
    expect(atravessaParede([P(0, 3.5, 9, 3.5)], 4.5, 1.5, 4.5, 3.5)).toBe(true)
  })
  it('formas viram segmentos fechados', () => {
    expect(segmentosDaForma('linha', { x: 0, y: 0 }, { x: 3, y: 1 })).toEqual([[0, 0, 3, 1]])
    expect(segmentosDaForma('retangulo', { x: 1, y: 1 }, { x: 4, y: 3 })).toHaveLength(4)
    const tri = segmentosDaForma('triangulo', { x: 0, y: 0 }, { x: 4, y: 4 })
    expect(tri).toHaveLength(3); expect(tri[0].slice(0, 2)).toEqual([2, 0])
    const c = segmentosDaForma('circulo', { x: 5, y: 5 }, { x: 8, y: 5 })
    expect(c.length).toBeGreaterThanOrEqual(12); expect(c[c.length - 1].slice(2)).toEqual(c[0].slice(0, 2))
    // Sala redonda fecha o token lá dentro.
    const sala = c.map(([x1, y1, x2, y2], i) => ({ id: 'circ-000' + i, x1, y1, x2, y2, tipo: 'parede' as const }))
    expect(caminhoLivre(sala, 12, 12, { x: 4, y: 4 }, { x: 10, y: 4 })).toBe(false)
  })
  it('traço à mão livre é simplificado e cabe num pedido', () => {
    const reta = Array.from({ length: 50 }, (_, i) => [i * 0.1, 2] as [number, number])
    expect(segmentosDaForma('livre', { x: 0, y: 2 }, { x: 4.9, y: 2 }, reta)).toHaveLength(1)
    const zigue = Array.from({ length: 600 }, (_, i) => [i * 0.05, 2 + Math.sin(i / 3)] as [number, number])
    expect(segmentosDaForma('livre', { x: 0, y: 2 }, { x: 30, y: 2 }, zigue).length).toBeLessThanOrEqual(MAX_PAREDES_PEDIDO)
  })
})
