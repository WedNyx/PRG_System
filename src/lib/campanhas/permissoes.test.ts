import { describe, expect, it } from 'vitest'
import { CAMPOS, permissoesPadrao, regraEfetiva } from './permissoes'
describe('permissões de campanha', () => {
  it('usa o modelo C como compartilhado', () => {
    const regras = permissoesPadrao('C')
    expect(regras.pv).toBe('livre')
    expect(regras.atributos).toBe('aprovacao')
  })
  it('modelo B reserva alterações ao mestre', () => {
    expect(Object.values(permissoesPadrao('B')).every(v => v === 'mestre')).toBe(true)
  })
  it('exceção individual prevalece apenas no campo indicado', () => {
    const padrao = permissoesPadrao('C')
    const excecao = { atributos: 'livre' as const }
    expect(regraEfetiva(padrao, excecao, 'atributos')).toBe('livre')
    expect(regraEfetiva(padrao, excecao, 'nivel')).toBe('aprovacao')
  })
  it('todos os campos têm regra definida', () => {
    for (const modelo of ['A','B','C'] as const) for (const campo of CAMPOS) expect(permissoesPadrao(modelo)[campo.id]).toBeTruthy()
  })
})
