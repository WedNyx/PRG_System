import { describe, expect, it } from 'vitest'
import { notacao3D } from './dados3d'

describe('notação dos dados 3D com resultado do servidor', () => {
  it('casa cada dado com o valor sorteado', () => {
    expect(notacao3D('1d20', [7])).toBe('1d20@7')
    expect(notacao3D('1d20+5', [13])).toBe('1d20@13')
    expect(notacao3D('2d20kh1+3', [4, 17])).toBe('2d20@4,17')
    expect(notacao3D('1d20+2d6-1', [11, 3, 5])).toBe('1d20+2d6@11,3,5')
  })
  it('explosões viram dados extras', () => {
    expect(notacao3D('2d6!', [6, 6, 2, 4])).toBe('4d6@6,6,2,4')
  })
  it('Fate e sucessos', () => {
    expect(notacao3D('4df+1', [-1, 0, 1, 1])).toBe('4df@-1,0,1,1')
    expect(notacao3D('5d6s5', [1, 5, 6, 2, 3])).toBe('5d6@1,5,6,2,3')
  })
  it('dados que o 3D não tem ficam fora (sem embaralhar os outros)', () => {
    expect(notacao3D('1d1000', [432])).toBeNull()
    expect(notacao3D('1d3+1d20', [2, 15])).toBe('1d20@15')
    expect(notacao3D('30d6', Array(30).fill(3))).toBeNull()
  })
})
