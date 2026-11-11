import { describe, expect, it } from 'vitest'
import { arteDoItem, FORMAS, lerArte, lerRaridade, nomeAleatorio } from './itensArte'

describe('forja de itens', () => {
  it('sugere a forma pelo nome e depois pelo tipo', () => {
    expect(arteDoItem({ nome: 'Adaga envenenada', categoria: 'arma' }).forma).toBe('adaga')
    expect(arteDoItem({ nome: 'Elixir de cura', categoria: 'consumivel' }).forma).toBe('pocao')
    expect(arteDoItem({ nome: 'Coisa estranha', categoria: 'armadura' }).forma).toBe('armadura')
    expect(arteDoItem({ nome: 'X', categoria: 'arma', arte: { forma: 'arco', cor: '#ff0000', cor2: 'azul' } })).toEqual({ forma: 'arco', cor: '#ff0000', cor2: '#a78bfa' })
  })
  it('valida forma e raridade', () => {
    expect(lerArte({ forma: '<script>' })).toBeNull()
    expect(lerRaridade('lendario')).toBe('lendario'); expect(lerRaridade('mítico')).toBeUndefined()
  })
  it('todas as formas desenham sem quebrar e só com cores válidas', () => {
    for (const f of FORMAS) { const s = f.desenho('#111111', '#222222'); expect(s).toContain('#111111'); expect(s).not.toContain('undefined') }
  })
  it('gera nomes', () => { expect(nomeAleatorio('espada', () => 0)).toBe('Lâmina do Crepúsculo') })
})
