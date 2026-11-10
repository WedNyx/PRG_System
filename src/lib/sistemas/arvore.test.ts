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

describe('árvore padrão do sistema e pontos do nível (v0.20)', () => {
  it('pontos extras da progressão contam para liberar', async () => {
    const { lerArvore, podeLiberar, disponiveis } = await import('./arvore')
    const a = lerArvore({ pontos: 0, nos: [{ id: 'a', nome: 'A', custo: 2 }] })
    expect(podeLiberar(a, 'a').ok).toBe(false)
    expect(podeLiberar(a, 'a', 2).ok).toBe(true)
    expect(disponiveis({ ...a, liberados: ['a'] }, 3)).toBe(1)
  })
  it('mescla a árvore do sistema sem perder o que a ficha tem', async () => {
    const { lerArvore, mesclarArvore, difereDoSistema } = await import('./arvore')
    const ficha = lerArvore({ pontos: 4, nos: [{ id: 'a', nome: 'Velho', custo: 1 }, { id: 'meu', nome: 'Só meu', custo: 1 }], liberados: ['a', 'meu'] })
    const sis = { nos: [{ id: 'a', nome: 'Novo nome', custo: 1 }, { id: 'b', nome: 'Novo', custo: 2, requer: ['a'] }] }
    expect(difereDoSistema(ficha, sis)).toBe(true)
    const m = mesclarArvore(ficha, sis)
    expect(m.nos.map(n => n.nome)).toEqual(['Novo nome', 'Novo', 'Só meu'])
    expect(m.liberados).toEqual(['a', 'meu']); expect(m.pontos).toBe(4)
    expect(difereDoSistema(m, sis)).toBe(false)
  })
  it('sistema autoral com árvore e progressão: ficha nova nasce com a árvore e ganha pontos por nível', async () => {
    const { validarSistema } = await import('./autoral')
    const { calcular, fichaVazia } = await import('./calculo')
    const r = validarSistema({
      nome: 'Com Nível', campos: [{ id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 }], atributos: [{ id: 'FOR', nome: 'Força', min: 0, max: 5, padrao: 1 }],
      derivados: [{ id: 'vida_max', nome: 'Vida', formula: '10 + prog_vida' }],
      progressoes: { classes: [{ nome: 'Nível', campoNivel: 'nivel', tabela: { arvore: [1, 2, 3], vida: [0, 5, 10] } }], colunas: { arvore: 'Pontos da árvore', vida: 'Vida' } },
      arvore: { pontos: 0, nos: [{ id: 'r', nome: 'Raiz', custo: 1, efeitos: [{ tipo: 'bonus', alvo: 'atributo:FOR', valor: 1 }, { tipo: 'bonus', alvo: 'atributo:NAOEXISTE', valor: 1 }] }] },
    }, { id: 'autoral-' + '0'.repeat(32) })
    expect(r.ok, !r.ok ? r.erros.join() : '').toBe(true); if (!r.ok) return
    expect(r.avisos.join()).toMatch(/bônus da árvore/)
    expect(r.sistema.progressoes?.classes[0].tabela.arvore).toHaveLength(20)
    const d = fichaVazia(r.sistema)
    expect((d.arvore as { nos: unknown[] }).nos).toHaveLength(1)
    const c1 = calcular(r.sistema, d), c3 = calcular(r.sistema, { ...d, campos: { ...d.campos, nivel: 3 } })
    expect([c1.vars.prog_arvore, c3.vars.prog_arvore, c3.derivados.vida_max]).toEqual([1, 3, 20])
    const sem = validarSistema({ nome: 'X', atributos: [{ nome: 'A' }], progressoes: { classes: [{ nome: 'Classe', campoNivel: 'inexistente', tabela: {} }] } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(!sem.ok && sem.erros.join()).toMatch(/campo do nível/)
  })
})
