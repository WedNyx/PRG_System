import { describe, expect, it } from 'vitest'
import { caminhoLivre, cruzam, distanciaParede, lerParedes, normalizarParede, passosBloqueados, type Parede } from './paredes'

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
    expect(caminhoLivre(sala(), 10, 10, { x: 8, y: 3 }, { x: 4, y: 4 })).toBe(false)
    expect(caminhoLivre(sala({ aberta: true }), 10, 10, { x: 8, y: 3 }, { x: 4, y: 4 })).toBe(true)
    expect(caminhoLivre(sala(), 10, 10, { x: 3, y: 3 }, { x: 5, y: 5 })).toBe(true) // dentro da sala anda à vontade
    expect(caminhoLivre(sala(), 10, 10, { x: 0, y: 0 }, { x: 9, y: 9 })).toBe(true) // por fora dá a volta
  })

  it('janela também bloqueia a passagem', () => {
    const s = sala().map(p => p.tipo === 'porta' ? { ...p, tipo: 'janela' as const } : p)
    expect(caminhoLivre(s, 10, 10, { x: 8, y: 3 }, { x: 4, y: 4 })).toBe(false)
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
    expect(normalizarParede({ x1: 0.5, y1: 0, x2: 2, y2: 0 }, 10, 10)).toBeNull()
    expect(normalizarParede({ x1: 0, y1: 0, x2: 2, y2: 0, tipo: 'porta', aberta: true }, 10, 10)).toMatchObject({ tipo: 'porta', aberta: true, trancada: false })
    expect(lerParedes([{ x1: 0, y1: 0, x2: 2, y2: 0 }, 'lixo'], 10, 10)).toHaveLength(1)
    expect(distanciaParede(P(0, 0, 4, 0), 2, 1)).toBeCloseTo(1)
  })
})
