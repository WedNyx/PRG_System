import { describe, expect, it } from 'vitest'
import { adiarNaOrdem, empatados, entrarNaOrdem, moverNaOrdem, mudarValor, sairDaOrdem } from './ordemCombate'

const L = [{ id: 'a', nome: 'A', valor: 18 }, { id: 'b', nome: 'B', valor: 15 }, { id: 'c', nome: 'C', valor: 15 }, { id: 'd', nome: 'D', valor: 9 }]
describe('ordem do combate', () => {
  it('entrar no meio não muda de quem é a vez', () => {
    const r = entrarNaOrdem(L, { id: 'n', nome: 'N', valor: 16 }, 2)
    expect(r.lista.map(x => x.id)).toEqual(['a', 'n', 'b', 'c', 'd'])
    expect(r.lista[r.turno].id).toBe('c')
    const fim = entrarNaOrdem(L, { id: 'z', nome: 'Z', valor: 15 }, 0)
    expect(fim.lista.map(x => x.id)).toEqual(['a', 'b', 'c', 'z', 'd'])
    expect(entrarNaOrdem([], { id: 'z', nome: 'Z', valor: 3 }, 0)).toEqual({ lista: [{ id: 'z', nome: 'Z', valor: 3 }], turno: 0 })
  })
  it('subir e descer para desempatar', () => {
    const r = moverNaOrdem(L, 'c', -1, 1)
    expect(r.lista.map(x => x.id)).toEqual(['a', 'c', 'b', 'd'])
    expect(r.lista[r.turno].id).toBe('b')
    expect(moverNaOrdem(L, 'a', -1, 0).lista).toBe(L)
    expect([...empatados(L)]).toEqual(['b', 'c'])
  })
  it('mudar o valor reordena e mantém a vez', () => {
    const r = mudarValor(L, 'd', 20, 1)
    expect(r.lista.map(x => x.id)).toEqual(['d', 'a', 'b', 'c'])
    expect(r.lista[r.turno].id).toBe('b')
  })
  it('sair do combate', () => {
    expect(sairDaOrdem(L, 'a', 2)).toMatchObject({ turno: 1 })
    const r = sairDaOrdem(L, 'd', 3); expect(r.turno).toBe(0)
    expect(sairDaOrdem(L, 'b', 1).lista[sairDaOrdem(L, 'b', 1).turno].id).toBe('c')
  })
  it('adiar troca com o próximo', () => {
    const r = adiarNaOrdem(L, 1)
    expect(r.lista.map(x => x.id)).toEqual(['a', 'c', 'b', 'd'])
    expect(r.lista[r.turno].id).toBe('c'); expect(r.adiou?.id).toBe('b')
    expect(adiarNaOrdem(L, 3).adiou).toBeNull()
  })
})
