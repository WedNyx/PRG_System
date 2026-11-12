import { describe, expect, it } from 'vitest'
import { concederNo, desfazer, devolverNo, disponiveis, excluirNoArvore, gastos, gravarNoArvore, lerArvore, liberarNo, mesclarArvore, mudarPontos, podeDevolver, podeLiberar, retirarNo, type Arvore } from './arvore'

const base = () => lerArvore({
  pontos: 3,
  nos: [
    { id: 'a', nome: 'Raiz', custo: 1 },
    { id: 'b', nome: 'Raio', custo: 2, requer: ['a'] },
    { id: 'c', nome: 'Tempestade', custo: 3, requer: ['b'], nivel: 5 },
  ],
})
const ok = (r: { arvore?: Arvore; erro?: string }) => { expect(r.erro).toBeUndefined(); return r.arvore! }

describe('nível mínimo dos hexágonos', () => {
  it('lê e limita o nível (0 some)', () => {
    const a = lerArvore({ nos: [{ id: 'x', nome: 'X', nivel: 25 }, { id: 'y', nome: 'Y', nivel: 0 }] })
    expect(a.nos[0].nivel).toBe(20); expect('nivel' in a.nos[1]).toBe(false)
  })
  it('só libera a partir do nível; sistema sem nível não confere', () => {
    let a = ok(liberarNo(base(), 'a')); a = { ...a, pontos: 9 }; a = ok(liberarNo(a, 'b'))
    expect(podeLiberar(a, 'c', 0, 4)).toEqual({ ok: false, motivo: 'Libera a partir do nível 5.' })
    expect(podeLiberar(a, 'c', 0, 5).ok).toBe(true)
    expect(podeLiberar(a, 'c', 0, null).ok).toBe(true)
  })
})

describe('exceções do mestre (conceder sem custo)', () => {
  it('concede sem pontos, sem requisito e sem nível; não conta nos gastos', () => {
    const a = ok(concederNo(base(), 'c'))
    expect(a.liberados).toContain('c'); expect(a.concedidos).toEqual(['c'])
    expect(gastos(a)).toBe(0); expect(disponiveis(a)).toBe(3)
  })
  it('jogador não devolve o concedido; o mestre retira', () => {
    const a = ok(concederNo(base(), 'a'))
    expect(podeDevolver(a, 'a').ok).toBe(false)
    expect(devolverNo(a, 'a').erro).toMatch(/mestre/)
    const r = ok(retirarNo(a, 'a'))
    expect(r.liberados).toEqual([]); expect(r.concedidos).toBeUndefined()
  })
  it('conceder algo já pago devolve os pontos', () => {
    const a = ok(liberarNo(base(), 'a')); expect(gastos(a)).toBe(1)
    expect(gastos(ok(concederNo(a, 'a')))).toBe(0)
  })
  it('lerArvore só aceita concedidos que estão liberados; mesclar com o sistema mantém concessões e histórico', () => {
    expect(lerArvore({ nos: [{ id: 'a', nome: 'A' }], liberados: [], concedidos: ['a', 'zz'] }).concedidos).toBeUndefined()
    const a = ok(concederNo(base(), 'a'))
    const m = mesclarArvore(a, { nos: [{ id: 'novo', nome: 'Novo' }] })
    expect(m.concedidos).toEqual(['a']); expect(m.historico?.length).toBe(1)
  })
})

describe('histórico e desfazer', () => {
  it('registra cada ação, a mais nova primeiro, e guarda no máximo 40', () => {
    let a = ok(liberarNo(base(), 'a'))
    a = ok(liberarNo(a, 'b'))
    expect(a.historico?.map(e => [e.acao, e.nome])).toEqual([['liberar', 'Raio'], ['liberar', 'Raiz']])
    for (let i = 0; i < 50; i++) a = ok(mudarPontos(a, a.pontos + 1))
    expect(a.historico).toHaveLength(40)
    expect(lerArvore(JSON.parse(JSON.stringify(a))).historico).toHaveLength(40)
  })
  it('desfaz liberar (devolve), mas não se outro depende dele', () => {
    let a = ok(liberarNo(base(), 'a')); a = ok(liberarNo(a, 'b'))
    const raiz = a.historico!.find(e => e.nome === 'Raiz')!
    expect(desfazer(a, raiz.id).erro).toMatch(/Devolva antes: Raio/)
    const raio = a.historico![0]
    a = ok(desfazer(a, raio.id))
    expect(a.liberados).toEqual(['a']); expect(a.historico![0].desfeito).toBe(true)
    expect(desfazer(a, raio.id).erro).toMatch(/Já foi desfeita/)
  })
  it('desfaz devolver (libera de novo se ainda cabe)', () => {
    let a = ok(liberarNo(base(), 'a')); a = ok(devolverNo(a, 'a'))
    a = ok(desfazer(a, a.historico![0].id)); expect(a.liberados).toEqual(['a'])
  })
  it('desfaz criar, editar e excluir', () => {
    let a = gravarNoArvore(base(), { id: 'd', nome: 'Novo', custo: 1, cor: '#a78bfa', x: 0, y: 0, requer: [], efeitos: [] })
    expect(a.historico![0].acao).toBe('criar')
    a = ok(desfazer(a, a.historico![0].id)); expect(a.nos.some(n => n.id === 'd')).toBe(false)
    const raio = a.nos.find(n => n.id === 'b')!
    a = gravarNoArvore(a, { ...raio, nome: 'Relâmpago', custo: 5 })
    expect(a.historico![0]).toMatchObject({ acao: 'editar', nome: 'Relâmpago' })
    a = ok(desfazer(a, a.historico![0].id)); expect(a.nos.find(n => n.id === 'b')).toMatchObject({ nome: 'Raio', custo: 2 })
    a = excluirNoArvore(a, 'c'); expect(a.nos.some(n => n.id === 'c')).toBe(false)
    a = ok(desfazer(a, a.historico![0].id)); expect(a.nos.find(n => n.id === 'c')).toMatchObject({ nome: 'Tempestade', nivel: 5, requer: ['b'] })
  })
  it('desfaz pontos, mas não abaixo do que já foi gasto', () => {
    let a = ok(mudarPontos(base(), 1))
    expect(mudarPontos(ok(liberarNo(a, 'a')), 0).erro).toMatch(/gastos/)
    a = ok(desfazer(a, a.historico![0].id)); expect(a.pontos).toBe(3)
  })
  it('desfaz conceder e retirar', () => {
    let a = ok(concederNo(base(), 'c'))
    a = ok(desfazer(a, a.historico![0].id)); expect(a.liberados).toEqual([]); expect(a.concedidos).toBeUndefined()
    a = ok(concederNo(a, 'a')); a = ok(retirarNo(a, 'a'))
    a = ok(desfazer(a, a.historico![0].id)); expect(a.concedidos).toEqual(['a'])
  })
  it('lerArvore descarta entradas inválidas do histórico', () => {
    const a = lerArvore({ nos: [], historico: [{ id: 'h1', acao: 'liberar', nome: 'X', em: '2026-11-12T10:00:00Z' }, { id: 'h2', acao: 'hackear', nome: 'Y', em: '2026-11-12T10:00:00Z' }, { id: 'h3', acao: 'pontos', nome: 'Z', em: 'ontem' }] })
    expect(a.historico?.map(e => e.id)).toEqual(['h1'])
  })
})
