import { describe, expect, it } from 'vitest'
import { moverPonto, pontosColocados } from './nivel'
import type { DadosFicha, Sistema } from './tipos'

const s = { atributos: [{ id: 'for', nome: 'Força', min: 0, max: 5, padrao: 1 }, { id: 'des', nome: 'Destreza', min: 0, max: 5, padrao: 1 }] } as unknown as Sistema
const d = { sistema: 'x', nome: 'A', campos: {}, atributos: { for: 4, des: 1 }, pericias: {}, recursos: {}, listas: {} } as DadosFicha

describe('pontos de atributo por nível', () => {
  it('coloca e tira pontos sem passar do disponível', () => {
    const a = moverPonto(s, d, 'des', 1, 2)!
    expect(a.atributos.des).toBe(2)
    expect(pontosColocados(a)).toBe(1)
    const b = moverPonto(s, a, 'des', 1, 2)!
    expect(moverPonto(s, b, 'des', 1, 2)).toBeNull()
    const c = moverPonto(s, b, 'des', -1, 2)!
    expect(c.atributos.des).toBe(2)
    expect(c.nivelAtributos).toEqual({ des: 1 })
  })
  it('respeita o máximo e não tira pontos que não vieram de nível', () => {
    const a = moverPonto(s, d, 'for', 1, 3)!
    expect(moverPonto(s, a, 'for', 1, 3)).toBeNull()
    expect(moverPonto(s, d, 'for', -1, 3)).toBeNull()
    expect(moverPonto(s, d, 'xx', 1, 3)).toBeNull()
  })
})
