import { describe, expect, it } from 'vitest'
import { fichaVazia, calcular } from './calculo'
import { sistemaPorId } from './catalogo'
import { aplicarDescanso } from './descanso'
import { magiasDaEspecieDnd, maximosMagiaEspecieDnd, RECURSOS_ESPECIE } from './dnd2024MagiasEspecie'
import type { DadosFicha } from './tipos'

const sistema = sistemaPorId('dnd5e-srd')!
function personagem(especie: string, linhagem: string, nivel = 1): DadosFicha {
  const d = fichaVazia(sistema)
  const id = especie === 'Elfo' ? 'elfo' : especie === 'Gnomo' ? 'gnomo' : 'tiferino'
  const k = id === 'tiferino' ? 'esp-tiferino-legado' : 'esp-' + id + '-linhagem'
  return { ...d, campos: { ...d.campos, classe: 'Guerreiro', especie, nivel },
    dndEscolhas: { [k]: linhagem, ['esp-' + id + '-atributo-magia']: 'carisma' } }
}
const ids = (d: DadosFicha) => magiasDaEspecieDnd(d)?.magias.map(m => m.id)

describe('Etapa 7 D&D 2024 — magias de espécies SRD 5.2.1', () => {
  it('sem linhagem ou atributo não libera magias por suposição', () => {
    const p = personagem('Elfo', 'drow', 5)
    p.dndEscolhas = { 'esp-elfo-linhagem': 'drow' }
    expect(magiasDaEspecieDnd(p)).toBeNull()
    expect(maximosMagiaEspecieDnd(p, 3)[RECURSOS_ESPECIE.nivel3]).toBe(0)
    p.dndEscolhas['esp-elfo-atributo-magia'] = 'carisma'
    expect(magiasDaEspecieDnd(p)?.atributo).toBe('CAR')
  })
  it.each([
    ['drow', ['dancing-lights','faerie-fire','darkness']],
    ['alto-elfo', ['prestidigitation','detect-magic','misty-step']],
    ['elfo-floresta', ['druidcraft','longstrider','pass-without-trace']],
  ])('Elfo %s progride no 1, 3 e 5 sem duplicar magias de classe', (linhagem, magias) => {
    const d1 = personagem('Elfo', linhagem, 1)
    const d3 = personagem('Elfo', linhagem, 3)
    const d5 = personagem('Elfo', linhagem, 5)
    expect(ids(d1)).toEqual([magias[0]])
    expect(ids(d3)).toEqual(magias.slice(0, 2))
    expect(ids(d5)).toEqual(magias)
    expect(calcular(sistema, d1).recursosMax[RECURSOS_ESPECIE.nivel3]).toBe(0)
    expect(calcular(sistema, d3).recursosMax[RECURSOS_ESPECIE.nivel3]).toBe(1)
    expect(calcular(sistema, d3).recursosMax[RECURSOS_ESPECIE.nivel5]).toBe(0)
    expect(calcular(sistema, d5).recursosMax[RECURSOS_ESPECIE.nivel5]).toBe(1)
    expect(d5.dndMagias).toBeUndefined()
  })
  it.each([
    ['abissal', ['thaumaturgy','poison-spray','ray-of-sickness','hold-person']],
    ['ctonico', ['thaumaturgy','chill-touch','false-life','ray-of-enfeeblement']],
    ['infernal', ['thaumaturgy','fire-bolt','hellish-rebuke','darkness']],
  ])('Tiferino %s tem Taumaturgia e legado com limite por nível', (linhagem, magias) => {
    expect(ids(personagem('Tiferino', linhagem, 1))).toEqual(magias.slice(0, 2))
    expect(ids(personagem('Tiferino', linhagem, 3))).toEqual(magias.slice(0, 3))
    expect(ids(personagem('Tiferino', linhagem, 5))).toEqual(magias)
  })
  it('Gnomo Floresta concede Falar com Animais por proficiência, Gnomo Rochas não concede usos', () => {
    const floresta = personagem('Gnomo', 'floresta', 9)
    const rochas = personagem('Gnomo', 'rochas', 9)
    expect(ids(floresta)).toEqual(['minor-illusion','speak-with-animals'])
    expect(ids(rochas)).toEqual(['mending','prestidigitation'])
    expect(calcular(sistema, floresta).recursosMax[RECURSOS_ESPECIE.animais]).toBe(4)
    expect(calcular(sistema, rochas).recursosMax[RECURSOS_ESPECIE.animais]).toBe(0)
    expect(maximosMagiaEspecieDnd(floresta, 5)[RECURSOS_ESPECIE.animais]).toBe(5)
  })
  it('cada magia gratuita recupera uso no descanso longo, sem recuperação no curto', () => {
    const d = personagem('Elfo', 'drow', 5)
    d.recursos[RECURSOS_ESPECIE.nivel3] = { atual: 0 }
    d.recursos[RECURSOS_ESPECIE.nivel5] = { atual: 0 }
    expect(aplicarDescanso(sistema, d, 'curto').d.recursos[RECURSOS_ESPECIE.nivel3].atual).toBe(0)
    const longo = aplicarDescanso(sistema, d, 'longo').d
    expect(longo.recursos[RECURSOS_ESPECIE.nivel3].atual).toBe(1)
    expect(longo.recursos[RECURSOS_ESPECIE.nivel5].atual).toBe(1)
    const g = personagem('Gnomo', 'floresta', 5)
    g.recursos[RECURSOS_ESPECIE.animais] = { atual: 0 }
    expect(aplicarDescanso(sistema, g, 'longo').d.recursos[RECURSOS_ESPECIE.animais].atual).toBe(3)
  })
  it('alterar espécie e linhagem suspende o máximo sem apagar os dados antigos', () => {
    const elfo = personagem('Elfo', 'drow', 5)
    elfo.recursos[RECURSOS_ESPECIE.nivel3] = { atual: 0 }
    const humano = { ...elfo, campos: { ...elfo.campos, especie: 'Humano' } }
    expect(magiasDaEspecieDnd(humano)).toBeNull()
    expect(calcular(sistema, humano).recursosMax[RECURSOS_ESPECIE.nivel3]).toBe(0)
    expect(elfo.dndEscolhas?.['esp-elfo-linhagem']).toBe('drow')
    const gnomo = personagem('Gnomo', 'rochas', 5)
    expect(calcular(sistema, gnomo).recursosMax[RECURSOS_ESPECIE.nivel3]).toBe(0)
  })
})
