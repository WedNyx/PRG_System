import { describe, expect, it } from 'vitest'
import { alterouDefinicaoArvore, validarDesbloqueiosArvore } from './arvorePermissoes'
import { lerArvore } from './arvore'

const d = { campos: { classe: 'Guerreiro', especie: 'Elfo', nivel: 3 }, dndEscolhas: {}, dndMulticlasse: {} }
const base = () => lerArvore({
  pontos: 2,
  nos: [
    { id:'a', nome:'Poder A', custo:1, x:0, y:0, requer: [], efeitos: [{ tipo:'bonus', alvo:'atributo:FOR', valor:1 }] },
    { id:'b', nome:'Poder B', custo:1, x:0, y:-100, requer:['a'], nivel:3, efeitos: [] },
  ],
  liberados: [],
})

describe('Servidor: jogador não modifica a estrutura ou recompensa do mestre', () => {
  it('bloqueia criar/editar/excluir nós, pontos e concessões', () => {
    const a = base()
    expect(alterouDefinicaoArvore(a, { ...a, pontos: 99 })).toBe(true)
    expect(alterouDefinicaoArvore(a, { ...a, nos: [...a.nos, { ...a.nos[0], id: 'c' }] })).toBe(true)
    expect(alterouDefinicaoArvore(a, { ...a, nos: a.nos.map(n => n.id === 'a' ? { ...n, custo: 0 } : n) })).toBe(true)
    expect(alterouDefinicaoArvore(a, { ...a, concedidos: ['b'], liberados:['b'] })).toBe(true)
    expect(validarDesbloqueiosArvore(a, { ...a, pontos: 99 }, d)).toMatch(/Somente o mestre/)
  })
  it('aceita desbloqueio de pontos sequencial e devolução reversa', () => {
    const a=base()
    expect(validarDesbloqueiosArvore(a, { ...a, liberados: ['a','b'] }, d)).toBeNull()
    expect(validarDesbloqueiosArvore({ ...a, liberados: ['a','b'] }, { ...a, liberados: [] }, d)).toBeNull()
  })
  it('não permite burlar pontos, requisito ou nível pelo JSON', () => {
    const a=base()
    expect(validarDesbloqueiosArvore(a, { ...a, liberados: ['b'] }, d)).toMatch(/Precisa/)
    expect(validarDesbloqueiosArvore(a, { ...a, liberados: ['a','b'] }, { ...d, campos: { ...d.campos, nivel: 1 } })).toMatch(/nível/)
    expect(validarDesbloqueiosArvore({ ...a, pontos: 1 }, { ...a, pontos: 1, liberados: ['a','b'] }, d)).toMatch(/Faltam/)
  })
  it('preserva concessão já dada pelo mestre, sem deixar o jogador retirá-la', () => {
    const a={ ...base(), liberados:['a'], concedidos:['a'] }
    expect(validarDesbloqueiosArvore(a, { ...a, liberados:[] }, d)).toMatch(/Somente o mestre/)
    expect(validarDesbloqueiosArvore(a, { ...a, liberados:['a','b'] }, d)).toBeNull()
  })
})
