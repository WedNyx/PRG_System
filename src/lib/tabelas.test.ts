import { describe, expect, it } from 'vitest'
import { idDeTabela, lerTabelas, rolarTabela, TABELAS_PRONTAS } from './tabelas'

describe('tabelas do mestre', () => {
  it('limpa as tabelas do mestre', () => {
    const t = lerTabelas([{ id: 'nomes-elficos', nome: 'Nomes élficos', icone: '🎲', linhas: ['Aelar', '  ', 'Lia'] }, { id: 'nomes', nome: 'Copia uma pronta', linhas: ['x'] }, { id: 'vazia', nome: 'Vazia', linhas: [] }, { id: 'X Y', nome: 'id ruim', linhas: ['a'] }])
    expect(t).toEqual([{ id: 'nomes-elficos', nome: 'Nomes élficos', icone: '🎲', linhas: ['Aelar', 'Lia'] }])
  })
  it('rola dados e puxa outras tabelas', () => {
    const todas = [...TABELAS_PRONTAS, { id: 'teste', nome: 'T', icone: '🎲', linhas: ['{2d2+10} moedas e [[outra]]'] }, { id: 'outra', nome: 'O', icone: '🎲', linhas: ['uma gema'] }]
    expect(rolarTabela('teste', todas)).toMatch(/^1[2-4] moedas e uma gema$/)
    const npc = rolarTabela('npc-completo', TABELAS_PRONTAS, () => 0)
    expect(npc).toBe('Bruna — gentil, mas mente sobre o passado. Segredo: deve dinheiro ao barão.')
    expect(rolarTabela('loop', [{ id: 'loop', nome: 'L', icone: '🎲', linhas: ['[[loop]]'] }])).toContain('[[loop]]')
  })
  it('id a partir do nome', () => { expect(idDeTabela('Nomes Élficos!')).toBe('nomes-elficos') })
  it('todas as prontas resolvem sem sobrar [[ ]] nem { }', () => {
    for (const t of TABELAS_PRONTAS) for (let i = 0; i < 20; i++) { const r = rolarTabela(t.id, TABELAS_PRONTAS); expect(r).not.toMatch(/\[\[|\{|\?$/) }
  })
})
