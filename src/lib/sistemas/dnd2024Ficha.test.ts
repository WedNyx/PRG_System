import { describe, expect, it } from 'vitest'
import { lerEscolhasDnd, progressoDaFichaDnd } from './dnd2024Ficha'
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
  it('não atribui marcos de Guerreiro a outras classes', () => {
    const p = progressoDaFichaDnd({ campos: { classe: 'Mago', nivel: 5 } })
    expect(progressaoVisivel(MARCOS_DND_2024, p)).toEqual([])
  })
  it('possui catálogo de marcos válido', () => expect(validarMarcos(MARCOS_DND_2024)).toEqual([]))
})
