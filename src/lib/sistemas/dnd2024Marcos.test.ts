import { describe, expect, it } from 'vitest'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { progressaoVisivel, validarMarcos } from './dnd2024Progressao'

describe('marcos D&D 2024 (dados abertos, visual)', () => {
  it('não tem IDs duplicados nem níveis fora de 1–20', () => {
    expect(validarMarcos(MARCOS_DND_2024)).toEqual([])
  })
  it('cataloga os marcos de 1 a 20 das três primeiras classes sem confundi-las', () => {
    for (const classe of ['guerreiro', 'ladino', 'mago']) {
      const daClasse = MARCOS_DND_2024.filter(m => m.origemId === classe)
      expect(daClasse.length).toBeGreaterThan(10)
      expect(Math.min(...daClasse.map(m => m.nivel))).toBe(1)
      expect(Math.max(...daClasse.map(m => m.nivel))).toBe(20)
    }
  })
  it('libera a escolha aberta de subclasse no nível 3, não antes', () => {
    const antes = progressaoVisivel(MARCOS_DND_2024, { nivelPorClasse: { ladino: 2 }, escolhas: {} })
    const depois = progressaoVisivel(MARCOS_DND_2024, { nivelPorClasse: { ladino: 3 }, escolhas: {} })
    expect(antes.find(m => m.id === 'ladino-subclasse')?.estado).toBe('futuro')
    expect(depois.find(m => m.id === 'ladino-subclasse')?.estado).toBe('escolher')
  })
  it('inclui ataque extra do Guerreiro e maestria em magias do Mago', () => {
    expect(MARCOS_DND_2024.find(m => m.id === 'guerreiro-tres-ataques-extra')?.nivel).toBe(20)
    expect(MARCOS_DND_2024.find(m => m.id === 'mago-maestria-magia')?.nivel).toBe(18)
    expect(MARCOS_DND_2024.find(m => m.id === 'ladino-golpe-de-sorte')?.nivel).toBe(20)
  })
})
