import { describe, expect, it } from 'vitest'
import { arvoreExemplo, bonusDaArvore, disponiveis, lerArvore, podeDevolver, podeLiberar, poderesDaArvore, sincronizarPoderes } from './arvore'
import { calcular, normalizarFicha } from './calculo'
import { sistemaPorId } from './catalogo'

const base = () => lerArvore({
  pontos: 3,
  nos: [
    { id: 'a', nome: 'Raiz', custo: 1, x: 0, y: 0, efeitos: [{ tipo: 'bonus', alvo: 'atributo:FOR', valor: 2 }] },
    { id: 'b', nome: 'Raio', custo: 2, x: 0, y: -100, requer: ['a'], efeitos: [{ tipo: 'poder', poder: { nome: 'Raio', expressao: '2d6', recurso: 'pm', custo: 3 } }] },
    { id: 'c', nome: 'Trovão', custo: 1, x: 0, y: -200, requer: ['b', 'fantasma'] },
  ],
  liberados: ['fantasma'],
})

describe('árvore de habilidades', () => {
  it('limpa dados ruins: requisitos e liberados inexistentes somem', () => {
    const a = base()
    expect(a.nos.map(n => n.id)).toEqual(['a', 'b', 'c'])
    expect(a.nos[2].requer).toEqual(['b'])
    expect(a.liberados).toEqual([])
    expect(lerArvore({ nos: [{ id: 'x', nome: '' }, { id: '../', nome: 'y' }] }).nos).toEqual([])
    expect(lerArvore({ nos: [{ id: 'x', nome: 'X', efeitos: [{ tipo: 'bonus', alvo: 'eval:1', valor: 3 }] }] }).nos[0].efeitos).toEqual([])
  })
  it('libera respeitando pré-requisitos e pontos', () => {
    const a = base()
    expect(podeLiberar(a, 'b').ok).toBe(false)
    expect(podeLiberar(a, 'a').ok).toBe(true)
    a.liberados.push('a')
    expect(disponiveis(a)).toBe(2)
    expect(podeLiberar(a, 'b').ok).toBe(true)
    a.liberados.push('b')
    expect(podeLiberar(a, 'c')).toEqual({ ok: false, motivo: 'Faltam 1 ponto(s).' })
    expect(podeDevolver(a, 'a').ok).toBe(false)
    expect(podeDevolver(a, 'b').ok).toBe(true)
  })
  it('efeitos: bônus e habilidade com id fixo do nó', () => {
    const a = base(); a.liberados.push('a', 'b')
    expect(bonusDaArvore(a)).toEqual({ 'atributo:FOR': 2 })
    const p = poderesDaArvore(a)
    expect(p).toHaveLength(1)
    expect(p[0]).toMatchObject({ id: 'arv-b-0', nome: 'Raio', expressao: '2d6', recurso: 'pm', custo: 3 })
    const outros = [{ id: 'meu', nome: 'Meu poder', tipo: 'magia' as const }, { id: 'arv-velho-0', nome: 'Velho', tipo: 'magia' as const }]
    expect(sincronizarPoderes(outros, a).map(x => x.id)).toEqual(['meu', 'arv-b-0'])
  })
  it('a ficha soma o bônus da árvore e mostra a habilidade liberada', () => {
    const s = sistemaPorId('dnd5e-srd')!
    const arvore = { pontos: 2, nos: [{ id: 'a', nome: 'Força do Urso', custo: 1, efeitos: [{ tipo: 'bonus', alvo: 'atributo:FOR', valor: 2 }, { tipo: 'poder', poder: { nome: 'Rugido', expressao: '1d8' } }] }], liberados: ['a'] }
    const d = normalizarFicha(s, { nome: 'Teste', atributos: { FOR: 10 }, arvore, poderes: [{ id: 'arv-falso-0', nome: 'Inventado' }] })
    expect((d.poderes as { id: string }[]).map(p => p.id)).toEqual(['arv-a-1'])
    expect(calcular(s, d).vars.FOR).toBe(12)
  })
  it('exemplo pronto é válido', () => {
    const a = arvoreExemplo([{ id: 'atributo:FOR', nome: 'Força' }])
    expect(a.nos).toHaveLength(5)
    expect(a.nos.find(n => n.id === 'mestre')?.requer).toEqual(['fogo2', 'gelo'])
    expect(poderesDaArvore({ ...a, liberados: ['raiz', 'fogo'] })[0].nome).toBe('Centelha')
  })
})
