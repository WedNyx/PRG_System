import { describe, expect, it } from 'vitest'
import { lerArquivo, montarArquivo, nomeDoArquivo } from './fichaArquivo'

describe('ficha em arquivo', () => {
  it('monta e lê de volta', () => {
    const a = montarArquivo('dnd5e-srd', { nome: 'Lyra Nyx', campos: { classe: 'Mago' } }, 'D&D 5ª edição')
    expect(nomeDoArquivo(a)).toBe('lyra-nyx-dnd5e-srd.json')
    const r = lerArquivo(JSON.stringify(a))
    expect(r).toMatchObject({ ok: true, sistema: 'dnd5e-srd', nome: 'Lyra Nyx' })
    if (r.ok) expect(r.dados.sistema).toBe('dnd5e-srd')
  })
  it('recusa arquivos estranhos', () => {
    expect(lerArquivo('não é json').ok).toBe(false)
    expect(lerArquivo(JSON.stringify({ formato: 'outro' })).ok).toBe(false)
    expect(lerArquivo(JSON.stringify({ formato: 'prg-ficha', versao: 2, sistema: 'x', dados: {} })).ok).toBe(false)
    expect(lerArquivo(JSON.stringify({ formato: 'prg-ficha', versao: 1, sistema: '../x', dados: {} })).ok).toBe(false)
    expect(lerArquivo(JSON.stringify({ formato: 'prg-ficha', versao: 1, sistema: 'fate-core', dados: [] })).ok).toBe(false)
  })
})
