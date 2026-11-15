import { describe, expect, it } from 'vitest'
import { detectarCritico, montarRolagem, rolarExpressao } from './dice'

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

  it('aceita os principais tamanhos de dado usados nos sistemas', () => {
    for (const lados of [2, 3, 4, 6, 8, 10, 12, 20, 30, 100]) {
      const r = rolarExpressao('1d' + lados)
      expect(r).not.toBeNull()
      expect(r!.total).toBeGreaterThanOrEqual(1)
      expect(r!.total).toBeLessThanOrEqual(lados)
    }
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
  it('desvantagem considera o MENOR d20, não qualquer 20 na rolagem', () => {
    expect(detectarCritico('2d20kl1', [20, 1])).toBe('falha')
    expect(detectarCritico('2d20kl1', [20, 13])).toBeNull()
    expect(detectarCritico('2d20kl1', [20, 20])).toBe('critico')
  })

  it('parada de Ordem usa o d20 mantido, inclusive quando o atributo é zero', () => {
    expect(detectarCritico('3d20kh1+5', [1, 20, 8])).toBe('critico')
    expect(detectarCritico('2d20kl1+5', [1, 18])).toBe('falha')
    expect(detectarCritico('3d20kh1+5', [1, 8, 12])).toBeNull()
  })

  it('separa os dados de bônus dos d20 de ataque', () => {
    expect(detectarCritico('1d20+1d100', [2, 20])).toBeNull()
    expect(detectarCritico('1d20+2d4+1', [20, 1, 4])).toBe('critico')
    expect(detectarCritico('1d20+2d4+1', [1, 1, 4])).toBe('falha')
    expect(detectarCritico('2d20kh1+2d6', [9, 20, 2, 4])).toBe('critico')
  })

  it('não inventa críticos universais para pools e explosões', () => {
    expect(detectarCritico('2d20', [20, 1])).toBeNull()
    expect(detectarCritico('1d20!', [20, 3])).toBeNull()
    expect(detectarCritico('6d6s5', [6, 6, 5, 3, 1, 4])).toBeNull()
    expect(detectarCritico('1d20+1d20', [20, 1])).toBeNull()
  })
})

describe('rolagens personalizadas (v0.16)', () => {
  it('conta sucessos', () => {
    const r = rolarExpressao('6d6s5')!
    expect(r.total).toBe(r.resultados.filter(v => v >= 5).length)
  })
  it('dados Fate', () => {
    const r = rolarExpressao('4df+2')!
    expect(r.resultados).toHaveLength(4)
    expect(r.resultados.every(v => v >= -1 && v <= 1)).toBe(true)
    expect(r.total).toBe(r.resultados.reduce((a, b) => a + b, 0) + 2)
  })
  it('explode e mantém (Roll and Keep)', () => {
    const r = rolarExpressao('5d10!kh2')!
    expect(r).not.toBeNull()
    expect(r.resultados.length).toBeGreaterThanOrEqual(5)
    expect(r.total).toBeGreaterThanOrEqual(2)
  })
  it('rerrola 1', () => {
    for (let i = 0; i < 30; i++) expect(rolarExpressao('1d2r1')).not.toBeNull()
  })
  it('limites', () => {
    expect(rolarExpressao('60d6+60d6')).toBeNull()
    expect(rolarExpressao('2d6s7')).toBeNull()
  })
  it('monta a fórmula com VALOR', () => {
    expect(montarRolagem('1d20+VALOR', 3)).toBe('1d20+3')
    expect(montarRolagem('1d20+VALOR', -2)).toBe('1d20-2')
    expect(montarRolagem('VALORd6s5', 0)).toBe('1d6s5')
    expect(montarRolagem('VALORd10!kh2', 5)).toBe('5d10!kh2')
    expect(montarRolagem('2d20kh1 + VALOR', 4)).toBe('2d20kh1+4')
    expect(montarRolagem('4dF+VALOR', 1)).toBe('4df+1')
    expect(montarRolagem('VALORd10!kh2', 1)).toBe('1d10!kh1')
  })
})
