import { describe, expect, it } from 'vitest'
import { normalizarRodadas, passarRodada } from './condicoes'

describe('duração das condições', () => {
  it('guarda só durações válidas das condições ativas', () => {
    expect(normalizarRodadas({ envenenado: 3, caido: 0, cego: 200, lento: '2', fantasma: 4 }, ['envenenado', 'caido', 'cego', 'lento'])).toEqual({ envenenado: 3, lento: 2 })
    expect(normalizarRodadas(null, ['x'])).toEqual({})
  })
  it('fim do turno desconta 1 e tira as que acabam', () => {
    const r = passarRodada(['envenenado', 'caido', 'atordoado'], { envenenado: 2, atordoado: 1 })
    expect(r).toEqual({ condicoes: ['envenenado', 'caido'], rodadas: { envenenado: 1 }, acabaram: ['atordoado'] })
  })
})
