import { describe, expect, it } from 'vitest'
import { lerEscolhasDnd, progressoDaFichaDnd, validarAlteracoesEscolhasDnd } from './dnd2024Ficha'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { progressaoVisivel, validarMarcos } from './dnd2024Progressao'

describe('adaptação da ficha D&D', () => {
  it('converte nomes acentuados e nível da ficha', () => {
    const p = progressoDaFichaDnd({ campos: { classe: 'Guerreiro', especie: 'Anão', antecedente: 'Soldado', nivel: 3 } })
    expect(p.nivelPorClasse.guerreiro).toBe(3)
    expect(p.especieId).toBe('anao')
    expect(p.antecedenteId).toBe('soldado')
  })
  it('mantém as escolhas de subclasse e sinaliza escolhas pendentes', () => {
    const p = progressoDaFichaDnd({ campos: { classe: 'Guerreiro', nivel: 3 }, dndEscolhas: { 'guerreiro-subclasse': 'campeao' } })
    expect(progressaoVisivel(MARCOS_DND_2024, p).find(m => m.id === 'guerreiro-subclasse')?.estado).toBe('adquirido')
  })
  it('filtra escolhas inválidas', () => {
    expect(lerEscolhasDnd({ 'guerreiro-subclasse': 'campeao', foo: '<script>' })).toEqual({ 'guerreiro-subclasse': 'campeao' })
  })
  it('não mistura progressões de classes diferentes', () => {
    const p = progressoDaFichaDnd({ campos: { classe: 'Mago', nivel: 5 } })
    const marcos = progressaoVisivel(MARCOS_DND_2024, p)
    expect(marcos.some(m => m.origemId === 'guerreiro')).toBe(false)
    expect(marcos.some(m => m.origemId === 'mago')).toBe(true)
  })
  it('não permite subclasse antes do nível 3', () => {
    expect(validarAlteracoesEscolhasDnd(
      { campos: { classe: 'Guerreiro', nivel: 2 }, dndEscolhas: {} },
      { campos: { classe: 'Guerreiro', nivel: 2 }, dndEscolhas: { 'guerreiro-subclasse': 'campeao' } },
    )[0]).toMatch(/nível 3/)
  })
  it('aceita subclasse catalogada na classe e nível corretos', () => {
    expect(validarAlteracoesEscolhasDnd(
      { campos: { classe: 'Ladino', nivel: 2 }, dndEscolhas: {} },
      { campos: { classe: 'Ladino', nivel: 3 }, dndEscolhas: { 'ladino-subclasse': 'ladrao' } },
    )).toEqual([])
  })
  it('impede classe errada ou subclasse inexistente', () => {
    expect(validarAlteracoesEscolhasDnd(
      { campos: { classe: 'Mago', nivel: 3 }, dndEscolhas: {} },
      { campos: { classe: 'Mago', nivel: 3 }, dndEscolhas: { 'guerreiro-subclasse': 'campeao' } },
    )).not.toEqual([])
    expect(validarAlteracoesEscolhasDnd(
      { campos: { classe: 'Guerreiro', nivel: 3 }, dndEscolhas: {} },
      { campos: { classe: 'Guerreiro', nivel: 3 }, dndEscolhas: { 'guerreiro-subclasse': 'inexistente' } },
    )).not.toEqual([])
  })
  it('preserva escolhas antigas desconhecidas quando não alteradas', () => {
    const antiga = { 'marco-legado': 'opcao-legada' }
    expect(validarAlteracoesEscolhasDnd(
      { campos: { classe: 'Guerreiro', nivel: 5 }, dndEscolhas: antiga },
      { campos: { classe: 'Guerreiro', nivel: 5 }, dndEscolhas: antiga },
    )).toEqual([])
  })
  it('revalidação rejeita subclasse se o aumento de nível foi negado pelo mestre', () => {
    const anterior = { campos: { classe: 'Guerreiro', nivel: 2 }, dndEscolhas: {} }
    const solicitado = { campos: { classe: 'Guerreiro', nivel: 3 }, dndEscolhas: { 'guerreiro-subclasse': 'campeao' } }
    expect(validarAlteracoesEscolhasDnd(anterior, solicitado)).toEqual([])
    const aposPermissoes = { ...solicitado, campos: { classe: 'Guerreiro', nivel: 2 } }
    expect(validarAlteracoesEscolhasDnd(anterior, aposPermissoes)).not.toEqual([])
  })
  it('possui catálogo de marcos válido', () => expect(validarMarcos(MARCOS_DND_2024)).toEqual([]))
})
