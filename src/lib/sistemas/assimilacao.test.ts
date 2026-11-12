import { describe, expect, it } from 'vitest'
import { FACES, lerResultados, montarTeste, montarTesteAssimilacao, nivelDeSaude, penalidadeSaude, somar, sugerirMantidos } from './assimilacao'

describe('dados de Assimilação', () => {
  it('as faces batem com as contas do livro (d6: 3 C, 1 B, 1 A · d10: 5 C, 3 B, 7 A · d12: 8 C, 5 B, 8 A)', () => {
    const t = (l: 6 | 10 | 12) => somar(FACES[l])
    expect(t(6)).toEqual({ a: 1, b: 1, c: 3 })
    expect(t(10)).toEqual({ a: 7, b: 3, c: 5 })
    expect(t(12)).toEqual({ a: 8, b: 5, c: 8 })
    expect(FACES[6].length).toBe(6); expect(FACES[10].length).toBe(10); expect(FACES[12].length).toBe(12)
  })
  it('monta o teste: Instinto em d6, aptidão em d10; agir por instinto vira d12 e mantém +1', () => {
    expect(montarTeste({ instinto: 2, aptidao: 3 })).toMatchObject({ expressao: '2d6+3d10', manter: 1, total: 5 })
    expect(montarTeste({ instinto: 2, aptidao: 0, determinacao: 1, origens: 1 })).toMatchObject({ expressao: '2d6', manter: 2 })
    expect(montarTeste({ instinto: 3, aptidao: 2, segundoInstinto: 2, determinacao: 1, origens: 2 })).toMatchObject({ expressao: '5d12', manter: 4 })
    expect(montarTeste({ instinto: 1, aptidao: 0, determinacao: 1 }).manter).toBe(1) // não mantém mais dados do que rolou
  })
  it('lê os resultados na ordem e sugere os melhores', () => {
    const m = montarTeste({ instinto: 2, aptidao: 2 })
    const d = lerResultados(m.grupos, [6, 3, 9, 7])
    expect(d.map(x => x.lados)).toEqual([6, 6, 10, 10])
    expect(d[0].face).toEqual({ a: 1, b: 0, c: 0 }); expect(d[2].face).toEqual({ a: 1, b: 1, c: 1 }); expect(d[3].face).toEqual({ a: 2, b: 0, c: 0 })
    expect(sugerirMantidos(d, 1)).toEqual([3])
    expect(sugerirMantidos(d, 2)).toEqual([0, 3])
  })
  it('Teste de Assimilação rola 1d10 + 1d12 por nível', () => {
    expect(montarTesteAssimilacao(2).expressao).toBe('1d10+2d12')
    expect(montarTesteAssimilacao(0).expressao).toBe('1d10')
  })
  it('penalidade e nível de Saúde', () => {
    expect(nivelDeSaude({ saude6: { atual: 0 }, saude5: { atual: 2 } })).toBe(5)
    expect(penalidadeSaude(4)).toEqual({ sucessos: 1, determinacao: false })
    expect(penalidadeSaude(2)).toEqual({ sucessos: 2, determinacao: true })
  })
})

describe('Assimilação na mesa', () => {
  it('lê expressões e calcula o resultado e o dano', async () => {
    const { gruposDaExpressao, resultadoAssim, danoAssim } = await import('./assimilacao')
    expect(gruposDaExpressao('3d6+2d10')).toEqual([{ lados: 6, qtd: 3 }, { lados: 10, qtd: 2 }])
    expect(gruposDaExpressao('1d20+2')).toBeNull()
    const r = resultadoAssim('2d6+1d10', [1, 6, 10], 1)
    expect(r.mantidos).toEqual([2]); expect(r.total).toEqual({ a: 2, b: 0, c: 1 })
    expect(danoAssim('2d10', [9, 3])).toBe(4)
    expect(danoAssim('1d8+2', [5])).toBeNull()
  })
})
