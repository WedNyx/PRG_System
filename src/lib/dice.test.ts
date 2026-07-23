import { describe, expect, it } from 'vitest'
import { detectarCritico, rolarExpressao } from './dice'

describe('rolarExpressao', () => {
  it('rola um dado simples', () => {
    const r = rolarExpressao('1d20')
    expect(r).not.toBeNull()
    expect(r!.resultados).toHaveLength(1)
    expect(r!.total).toBeGreaterThanOrEqual(1)
    expect(r!.total).toBeLessThanOrEqual(20)
  })

  it('soma modificadores', () => {
    const r = rolarExpressao('1d1+5')
    // d1 é inválido (mínimo 2 faces)
    expect(r).toBeNull()
    const r2 = rolarExpressao('2d6+3')
    expect(r2).not.toBeNull()
    expect(r2!.total).toBe(r2!.resultados[0] + r2!.resultados[1] + 3)
  })

  it('subtrai modificadores', () => {
    const r = rolarExpressao('1d20-2')
    expect(r).not.toBeNull()
    expect(r!.total).toBe(r!.resultados[0] - 2)
  })

  it('combina múltiplos grupos de dados', () => {
    const r = rolarExpressao('1d20+2d4+1')
    expect(r).not.toBeNull()
    expect(r!.resultados).toHaveLength(3)
  })

  it('vantagem (2d20kh1) usa o maior', () => {
    const r = rolarExpressao('2d20kh1')
    expect(r).not.toBeNull()
    expect(r!.resultados).toHaveLength(2)
    expect(r!.total).toBe(Math.max(...r!.resultados))
  })

  it('desvantagem (2d20kl1) usa o menor', () => {
    const r = rolarExpressao('2d20kl1')
    expect(r).not.toBeNull()
    expect(r!.total).toBe(Math.min(...r!.resultados))
  })

  it('4d6kh3 mantém os 3 maiores', () => {
    const r = rolarExpressao('4d6kh3')
    expect(r).not.toBeNull()
    expect(r!.resultados).toHaveLength(4)
    const ordenados = [...r!.resultados].sort((a, b) => b - a)
    expect(r!.total).toBe(ordenados[0] + ordenados[1] + ordenados[2])
  })

  it('dado explosivo pode gerar resultados extras', () => {
    const r = rolarExpressao('1d2!')
    expect(r).not.toBeNull()
    expect(r!.resultados.length).toBeGreaterThanOrEqual(1)
    // Se o último não é o máximo, todos os anteriores devem ser 2 (explosões)
    const rolls = r!.resultados
    for (let i = 0; i < rolls.length - 1; i++) {
      expect(rolls[i]).toBe(2)
    }
  })

  it('rejeita expressões inválidas', () => {
    expect(rolarExpressao('')).toBeNull()
    expect(rolarExpressao('abc')).toBeNull()
    expect(rolarExpressao('1d')).toBeNull()
    expect(rolarExpressao('d0')).toBeNull()
    expect(rolarExpressao('1000d6')).toBeNull()
    expect(rolarExpressao('1d99999')).toBeNull()
    expect(rolarExpressao('2d6kh3')).toBeNull() // keep maior que a quantidade
    expect(rolarExpressao('DROP TABLE')).toBeNull()
  })

  it('respeita limites de quantidade', () => {
    expect(rolarExpressao('100d6')).not.toBeNull()
    expect(rolarExpressao('101d6')).toBeNull()
  })
})

describe('detectarCritico', () => {
  it('detecta crítico no d20', () => {
    expect(detectarCritico('1d20+5', [20])).toBe('critico')
  })

  it('detecta falha crítica no d20', () => {
    expect(detectarCritico('1d20', [1])).toBe('falha')
  })

  it('não marca crítico sem d20', () => {
    expect(detectarCritico('1d6', [1])).toBeNull()
    expect(detectarCritico('3d20', [12, 5, 8])).toBeNull()
  })

  it('crítico vence falha quando ambos aparecem', () => {
    expect(detectarCritico('2d20kh1', [20, 1])).toBe('critico')
  })
})
