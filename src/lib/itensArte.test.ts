import { describe, expect, it } from 'vitest'
import { lerArte, lerRaridade } from './itensArte'
import { normalizarItem } from './sistemas/inventario'
import { sugestaoIcone } from './iconesRpg'

describe('ilustração dos itens sem a Forja (v0.35.3)', () => {
  it('valida a arte antiga e a raridade', () => {
    expect(lerArte({ forma: '<script>' })).toBeNull()
    expect(lerArte({ forma: 'arco', cor: '#ff0000' })?.forma).toBe('arco')
    expect(lerRaridade('lendario')).toBe('lendario'); expect(lerRaridade('mítico')).toBeUndefined()
  })
  it('item antigo com desenho da Forja vira o ícone equivalente e perde o campo arte', () => {
    const it = normalizarItem({ nome: 'Adaga velha', categoria: 'arma', peso: 1, arte: { forma: 'adaga', cor: '#cbd5e1', cor2: '#ef4444' } })!
    expect(it.iconeBiblioteca).toBe('lamina')
    expect('arte' in it).toBe(false)
  })
  it('o ícone escolhido vale mais que a arte antiga', () => {
    expect(normalizarItem({ nome: 'X', categoria: 'arma', arte: { forma: 'adaga' }, iconeBiblioteca: 'revolver' })!.iconeBiblioteca).toBe('revolver')
  })
  it('sem nada escolhido, o ícone vem do nome e do tipo', () => {
    expect(sugestaoIcone('Rifle laser', 'arma')).toBe('revolver')
    expect(sugestaoIcone('Poção de cura', 'consumivel')).toBe('pocao')
    expect(sugestaoIcone('Coisa estranha', 'tesouro')).toBe('gema')
  })
})
