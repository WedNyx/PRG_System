import { describe, expect, it } from 'vitest'
import { fatorDaRoda } from './zoomRoda'

describe('zoom pela rodinha', () => {
  it('um clique da rodinha muda pouco e é simétrico', () => {
    const dentro = fatorDaRoda(-100), fora = fatorDaRoda(100)
    expect(dentro).toBeGreaterThan(1.1); expect(dentro).toBeLessThan(1.2)
    expect(dentro * fora).toBeCloseTo(1)
  })
  it('rodinhas exageradas e modo “linhas” não dão pulos gigantes', () => {
    expect(fatorDaRoda(-5000)).toBeLessThan(1.3)
    expect(fatorDaRoda(-3, 1)).toBeCloseTo(fatorDaRoda(-99))
  })
})
