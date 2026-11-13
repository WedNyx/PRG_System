import { describe, expect, it } from 'vitest'
import { MARCOS_ORIGENS_SRD } from './dnd2024Origens'
import { validarAlteracoesEscolhasDnd } from './dnd2024Ficha'
import { efeitosDnd2024 } from './dnd2024Efeitos'
import { progressaoVisivel } from './dnd2024Progressao'
import { progressoDaFichaDnd } from './dnd2024Ficha'

const marco = (id: string) => MARCOS_ORIGENS_SRD.find(m => m.id === id)
const ficha = (especie: string, escolhas: Record<string, string> = {}) =>
  ({ campos: { classe: 'Guerreiro', especie, antecedente: 'Soldado', nivel: 1 }, dndEscolhas: escolhas })

describe('origens D&D 2024 — escolhas obrigatórias SRD', () => {
  it('guarda o atributo de conjuração das linhagens e legados', () => {
    for (const especie of ['elfo', 'gnomo', 'tiferino']) {
      const m = marco('esp-' + especie + '-atributo-magia')
      expect(m?.modo).toBe('escolha')
      expect(m?.opcoes?.map(o => o.id)).toEqual(['inteligencia', 'sabedoria', 'carisma'])
    }
  })
  it('Humanos podem escolher tamanho, perícia e talento de origem', () => {
    expect(marco('esp-humano-tamanho')?.opcoes?.map(o => o.id)).toEqual(['pequeno', 'medio'])
    expect(marco('esp-humano-habilidoso')?.opcoes).toHaveLength(18)
    expect(marco('esp-humano-versatil')?.opcoes?.some(o => o.id === 'alerta')).toBe(true)
  })
  it('exibe escolhas da espécie para um personagem de nível 1', () => {
    const vis = progressaoVisivel(MARCOS_ORIGENS_SRD, progressoDaFichaDnd(ficha('Elfo')))
    expect(vis.find(m => m.id === 'esp-elfo-atributo-magia')?.estado).toBe('escolher')
  })
  it('servidor aceita atributo de conjuração elegível e recusa atributo inválido', () => {
    const antes = ficha('Elfo')
    const valido = ficha('Elfo', { 'esp-elfo-atributo-magia': 'sabedoria' })
    const invalido = ficha('Elfo', { 'esp-elfo-atributo-magia': 'forca' })
    expect(validarAlteracoesEscolhasDnd(antes, valido)).toEqual([])
    expect(validarAlteracoesEscolhasDnd(antes, invalido)).not.toEqual([])
  })
  it('Humanos ganham proficiência escolhida; outras espécies não herdam escolha antiga', () => {
    const escolha = { 'esp-humano-habilidoso': 'percepcao', 'esp-humano-versatil': 'alerta' }
    const vars = { ca_base: 10, des_max: 10, armadura: 0, mod_CAR: 0, mod_DES: 1, mod_CON: 0, mod_SAB: 1 }
    const humano = efeitosDnd2024(ficha('Humano', escolha), vars)
    const elfo = efeitosDnd2024(ficha('Elfo', escolha), vars)
    expect(humano.treino.percepcao?.fonte).toBe('Habilidoso (Humano)')
    expect(elfo.treino.percepcao).toBeUndefined()
    expect(humano.vars.dnd_ini_extra).toBe(2)
    expect(elfo.vars.dnd_ini_extra).toBe(0)
  })
})
