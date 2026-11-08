import { describe, expect, it } from 'vitest'
import { avaliar, avaliarSeguro } from './formula'

describe('fórmulas', () => {
  it('PV de Lunethernnyis', () => expect(avaliar('25 + TEN * 5', { TEN: 3 })).toBe(40))
  it('modificador estilo d20', () => {
    expect(avaliar('piso((FOR - 10) / 2)', { FOR: 15 })).toBe(2)
    expect(avaliar('piso((FOR - 10) / 2)', { FOR: 8 })).toBe(-1)
  })
  it('bônus de proficiência por nível', () => {
    expect(avaliar('piso((nivel - 1) / 4) + 2', { nivel: 1 })).toBe(2)
    expect(avaliar('piso((nivel - 1) / 4) + 2', { nivel: 17 })).toBe(6)
  })
  it('funções e precedência', () => {
    expect(avaliar('max(1, 2, 3) + min(4, 5) * 2', {})).toBe(11)
    expect(avaliar('-(2 + 3) * 2', {})).toBe(-10)
    expect(avaliar('10 / 0', {})).toBe(0)
  })
  it('variável ausente vale 0', () => expect(avaliar('10 + DES', {})).toBe(10))
  it('recusa código e sintaxe inválida', () => {
    expect(avaliarSeguro('alert(1)', {})).toBeNull()
    expect(avaliarSeguro('constructor.constructor("x")()', {})).toBeNull()
    expect(avaliarSeguro('2 +', {})).toBeNull()
    expect(avaliarSeguro('a; b', {})).toBeNull()
  })
})
