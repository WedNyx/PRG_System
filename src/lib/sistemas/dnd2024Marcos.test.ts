import { describe, expect, it } from 'vitest'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { progressaoVisivel, validarMarcos } from './dnd2024Progressao'

describe('marcos D&D 2024 (dados abertos, visual)', () => {
  it('não tem IDs duplicados nem níveis fora de 1–20', () => {
    expect(validarMarcos(MARCOS_DND_2024)).toEqual([])
  })
  it('cataloga os marcos de 1 a 20 das doze classes sem confundi-las', () => {
    for (const classe of ['barbaro', 'bardo', 'bruxo', 'clerigo', 'druida', 'feiticeiro', 'guerreiro', 'ladino', 'mago', 'monge', 'paladino', 'patrulheiro']) {
      const daClasse = MARCOS_DND_2024.filter(m => m.origemId === classe)
      expect(daClasse.length).toBeGreaterThan(10)
      expect(Math.min(...daClasse.map(m => m.nivel))).toBe(1)
      expect(Math.max(...daClasse.map(m => m.nivel))).toBe(20)
    }
  })
  it('inclui uma escolha de subclasse aberta do SRD para cada uma das doze classes', () => {
    const classes = ['barbaro', 'bardo', 'bruxo', 'clerigo', 'druida', 'feiticeiro', 'guerreiro', 'ladino', 'mago', 'monge', 'paladino', 'patrulheiro']
    for (const classe of classes) {
      const m = MARCOS_DND_2024.find(m => m.id === classe + '-subclasse')
      expect(m?.nivel).toBe(3)
      expect(m?.modo).toBe('escolha')
      expect(m?.opcoes).toHaveLength(1)
    }
  })
  it('libera a escolha aberta de subclasse no nível 3, não antes', () => {
    const antes = progressaoVisivel(MARCOS_DND_2024, { nivelPorClasse: { ladino: 2 }, escolhas: {} })
    const depois = progressaoVisivel(MARCOS_DND_2024, { nivelPorClasse: { ladino: 3 }, escolhas: {} })
    expect(antes.find(m => m.id === 'ladino-subclasse')?.estado).toBe('futuro')
    expect(depois.find(m => m.id === 'ladino-subclasse')?.estado).toBe('escolher')
  })
  it('inclui ataque extra do Guerreiro e maestria em magias do Mago', () => {
    expect(MARCOS_DND_2024.find(m => m.id === 'guerreiro-n20-tres-ataques-extras')?.nivel).toBe(20)
    expect(MARCOS_DND_2024.find(m => m.id === 'mago-n18-maestria-em-magia')?.nivel).toBe(18)
    expect(MARCOS_DND_2024.find(m => m.id === 'ladino-n20-golpe-de-sorte')?.nivel).toBe(20)
  })
  it('subclasse: o genérico some e as características da subclasse escolhida aparecem', () => {
    const sem = progressaoVisivel(MARCOS_DND_2024, { nivelPorClasse: { guerreiro: 7 }, escolhas: {} })
    expect(sem.some(m => m.id === 'guerreiro-subclasse-n7')).toBe(true)
    expect(sem.some(m => m.nome.startsWith('Crítico Aprimorado'))).toBe(false)
    const com = progressaoVisivel(MARCOS_DND_2024, { nivelPorClasse: { guerreiro: 7 }, escolhas: { 'guerreiro-subclasse': 'campeao' } })
    expect(com.some(m => m.id === 'guerreiro-subclasse-n7')).toBe(false)
    expect(com.find(m => m.nome.startsWith('Crítico Aprimorado'))?.estado).toBe('adquirido')
    expect(com.find(m => m.nome.startsWith('Estilo de Luta Adicional'))?.estado).toBe('escolher')
  })
  it('aumento de atributo e dádiva épica são escolhas (não aparecem como adquiridas sem escolher)', () => {
    const v = progressaoVisivel(MARCOS_DND_2024, { nivelPorClasse: { mago: 19 }, escolhas: {} })
    expect(v.find(m => m.id === 'mago-talento-n4')?.estado).toBe('escolher')
    expect(v.find(m => m.id === 'mago-dadiva-n19')?.estado).toBe('escolher')
  })
  it('espécies e antecedentes do SRD aparecem pela escolha da ficha', () => {
    const v = progressaoVisivel(MARCOS_DND_2024, { nivelPorClasse: { bruxo: 3 }, especieId: 'tiferino', antecedenteId: 'sabio', escolhas: {} })
    expect(v.find(m => m.id === 'esp-tiferino-legado')?.estado).toBe('escolher')
    expect(v.find(m => m.id === 'esp-tiferino-legado-3')?.estado).toBe('adquirido')
    expect(v.find(m => m.id === 'esp-tiferino-legado-5')?.estado).toBe('futuro')
    expect(v.find(m => m.id === 'ant-sabio-talento')?.estado).toBe('adquirido')
    for (const e of ['anao', 'draconato', 'elfo', 'gnomo', 'golias', 'halfling', 'humano', 'orc', 'tiferino']) expect(MARCOS_DND_2024.some(m => m.origem === 'especie' && m.origemId === e)).toBe(true)
  })
})
