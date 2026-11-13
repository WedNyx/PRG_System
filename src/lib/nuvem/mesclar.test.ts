import { describe, expect, it } from 'vitest'
import { mesclarFicha } from './mesclar'

describe('juntar mudanças da mesma ficha', () => {
  const base = { nome: 'Lyra', itens: [] as unknown[], recursos: { pv: { atual: 20 }, pm: { atual: 5 } }, uso: { itens: {} } }
  it('item novo do jogador + dano da mesa: os dois ficam', () => {
    const minha = { ...base, itens: [{ id: 'a', nome: 'Corda' }], uso: { itens: { a: { qtd: 1 } } } }
    const servidor = { ...base, recursos: { pv: { atual: 12 }, pm: { atual: 5 } } }
    const r = mesclarFicha(base, minha, servidor)
    expect(r.itens).toEqual([{ id: 'a', nome: 'Corda' }])
    expect(r.recursos.pv.atual).toBe(12)
    expect(r.uso).toEqual({ itens: { a: { qtd: 1 } } })
  })
  it('mesmo objeto, chaves diferentes: junta por dentro', () => {
    const minha = { ...base, recursos: { pv: { atual: 20 }, pm: { atual: 2 } } }
    const servidor = { ...base, recursos: { pv: { atual: 9 }, pm: { atual: 5 } } }
    expect(mesclarFicha(base, minha, servidor).recursos).toEqual({ pv: { atual: 9 }, pm: { atual: 2 } })
  })
  it('o que eu mudei vence; o que eu apaguei some', () => {
    const minha = { ...base, nome: 'Lyra II' } as Record<string, unknown>; delete minha.uso
    const r = mesclarFicha(base as Record<string, unknown>, minha, { ...base, nome: 'Outro' })
    expect(r.nome).toBe('Lyra II'); expect('uso' in r).toBe(false)
  })
})
