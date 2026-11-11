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

describe('dano por turno', () => {
  it('aceita só expressões simples das condições ativas', async () => {
    const { normalizarDanos } = await import('./condicoes')
    expect(normalizarDanos({ queimando: '1D6', envenenado: '2d4+1', sangrando: '3', caido: '1d4', cego: 'abc' }, ['queimando', 'envenenado', 'sangrando', 'cego']))
      .toEqual({ queimando: '1d6', envenenado: '2d4+1', sangrando: '3' })
    expect(normalizarDanos({ queimando: '50d6' }, ['queimando'])).toEqual({})
    expect(normalizarDanos({ queimando: '1d6!kh1' }, ['queimando'])).toEqual({})
  })
})
