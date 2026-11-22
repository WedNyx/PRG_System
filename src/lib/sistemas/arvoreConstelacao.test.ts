import { describe, expect, it } from 'vitest'
import { lerArvore } from './arvore'
import { aneisDaArvore, ganhoDeNivel, pontosExtrasDaArvore } from './arvoreSistemas'
import { sistemaEmBranco, validarSistema } from './autoral'
import { fichaVazia, tornarManual } from './calculo'
import type { Sistema } from './tipos'

describe('árvore em constelação (v0.36.7)', () => {
  it('nó guarda símbolo, forma e tamanho do autor (e recusa o que não é seguro)', () => {
    const a = lerArvore({ pontos: 1, nos: [
      { id: 'a', nome: 'Peculiaridade', custo: 1, cor: '#e2e8f0', x: 0, y: 0, requer: [], efeitos: [], icone: '⚡', forma: 'circulo', tamanho: 'g' },
      { id: 'b', nome: 'Mente', custo: 1, cor: '#a78bfa', x: 100, y: 0, requer: ['a'], efeitos: [], icone: '<img>', forma: 'estrela', tamanho: 'x' },
      { id: 'c', nome: 'Hex', custo: 1, cor: '#a78bfa', x: 0, y: 100, requer: ['a'], efeitos: [], forma: 'hexagono', icone: 'MA' },
    ] })
    expect(a.nos[0]).toMatchObject({ icone: '⚡', forma: 'circulo', tamanho: 'g' })
    expect(a.nos[1].icone).toBeUndefined(); expect(a.nos[1].forma).toBeUndefined(); expect(a.nos[1].tamanho).toBeUndefined()
    expect(a.nos[2].forma).toBeUndefined(); expect(a.nos[2].icone).toBe('MA')
  })
  it('anéis: distâncias do centro agrupadas', () => {
    expect(aneisDaArvore([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 110 }, { x: 300, y: 0 }], { x: 0, y: 0 })).toEqual([105, 300])
  })
  it('pontos do próximo nível e aviso quando falta a escolha que liga a tabela', () => {
    const base = sistemaEmBranco() as Partial<Sistema> & Record<string, unknown>
    const v = validarSistema({ ...base, nome: 'Teste', campos: [{ id: 'nivel', nome: 'Nível', tipo: 'numero' }, { id: 'destaque', nome: 'Destaque', tipo: 'escolha', opcoes: [{ nome: 'Físico', progressao: 'fisico' }] }],
      progressoes: { colunas: { arvore: 'Pontos da árvore' }, classes: [{ id: 'fisico', nome: 'Físico', campoNivel: 'nivel', tabela: { arvore: [1, 2, 4, 6] } }] },
      arvore: { pontos: 1, nos: [{ id: 'a', nome: 'A', custo: 1, cor: '#e2e8f0', x: 0, y: 0, requer: [], efeitos: [] }] } }, { id: 'autoral-teste' })
    expect(v.ok).toBe(true)
    const s = (v as { sistema: Sistema }).sistema
    const d = fichaVazia(s, 'X')
    expect(ganhoDeNivel(s, { ...d, campos: { ...d.campos, nivel: 1 } })).toEqual({ ganhoProximo: 0, pendente: 'Destaque' })
    expect(ganhoDeNivel(s, { ...d, campos: { ...d.campos, nivel: 2, destaque: 'Físico' } })).toEqual({ ganhoProximo: 2 })
    // ficha manual (todas as fichas desde a v0.34.8): os pontos do nível valem mesmo sem passar pelas fórmulas
    const manual = tornarManual(s, { ...d, campos: { ...d.campos, nivel: 2, destaque: 'Físico' } })
    expect(manual.manual).toBeTruthy()
    expect(pontosExtrasDaArvore(s, manual)).toBe(2)
  })
})
