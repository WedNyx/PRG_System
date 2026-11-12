import { describe, expect, it } from 'vitest'
import { MAGIAS_SRD } from './dnd2024Magias'
import { TEXTO_MAGIAS_SRD } from './dnd2024MagiasTexto'
import { contarMagias, expressaoMagia, lerMagiasDnd, limitesMagiasDnd, magiaPorId, motivoBloqueio, recursoDoEspaco, validarAlteracoesMagiasDnd } from './dnd2024Conjuracao'
import { sistemaPorId } from './catalogo'
import { fichaVazia, normalizarFicha } from './calculo'

const f = (classe: string, nivel: number, dndEscolhas: Record<string, string> = {}, dndMagias: Record<string, 'preparada' | 'extra'> = {}) =>
  ({ campos: { classe, nivel }, dndEscolhas, dndMagias })
const m = (id: string) => magiaPorId(id)!

describe('catálogo de magias do SRD 5.2.1', () => {
  it('tem as 339 magias com nome em português, texto original e ids únicos', () => {
    expect(MAGIAS_SRD).toHaveLength(339)
    expect(new Set(MAGIAS_SRD.map(x => x.id)).size).toBe(339)
    expect(new Set(MAGIAS_SRD.map(x => x.nome)).size).toBe(339)
    for (const x of MAGIAS_SRD) {
      expect(x.classes.length).toBeGreaterThan(0)
      expect(TEXTO_MAGIAS_SRD[x.id]?.length).toBeGreaterThan(40)
    }
    expect(MAGIAS_SRD.filter(x => x.nivel === 0)).toHaveLength(27)
  })
  it('lê dados de Bola de Fogo e Rajada Mística', () => {
    expect(m('fireball')).toMatchObject({ nome: 'Bola de Fogo', nivel: 3, escola: 'Evocação', alcance: '45 m', dano: '8d6', porNivel: '1d6', resistencia: 'DES' })
    expect(m('fireball').classes).toEqual(['feiticeiro', 'mago'])
    expect(m('eldritch-blast')).toMatchObject({ nome: 'Rajada Mística', ataque: 'distancia', escalaTruque: true })
    expect(m('bless').concentracao).toBe(true)
    expect(m('detect-magic').ritual).toBe(true)
  })
})

describe('limites da tabela da classe', () => {
  it('Mago 5: 4 truques, 9 preparadas, até 3º nível', () => {
    expect(limitesMagiasDnd(f('Mago', 5))).toMatchObject({ atributo: 'INT', truques: 4, preparadas: 9, nivelMax: 3, listas: ['mago'] })
  })
  it('Bruxo 11: espaços de pacto de 5º e Arcana Mística de 6º', () => {
    const l = limitesMagiasDnd(f('Bruxo', 11))
    expect(l).toMatchObject({ nivelMax: 5, arcana: [6] })
    expect(motivoBloqueio(m('circle-of-death'), l, {})).toBeNull()
    expect(motivoBloqueio(m('circle-of-death'), l, { 'eyebite': 'preparada' })).toMatch(/Arcana/)
    expect(contarMagias({ 'circle-of-death': 'preparada', 'hex': 'preparada' }, l)).toMatchObject({ preparadas: 1, arcana: { 6: 1 } })
    expect(recursoDoEspaco(l, 5)).toBe('pacto')
  })
  it('Bárbaro não conjura; Paladino 1 não tem truques; Guerreiro Abençoado dá 2 truques de Clérigo', () => {
    expect(limitesMagiasDnd(f('Bárbaro', 5)).atributo).toBe('')
    expect(motivoBloqueio(m('sacred-flame'), limitesMagiasDnd(f('Paladino', 1)), {})).toMatch(/lista|truques/)
    const l = limitesMagiasDnd(f('Paladino', 2, { 'paladino-n2-estilo-de-luta': 'guerreiro-abencoado' }))
    expect(l.truques).toBe(2); expect(motivoBloqueio(m('sacred-flame'), l, {})).toBeNull()
    expect(motivoBloqueio(m('fire-bolt'), l, {})).toMatch(/lista/)
  })
  it('Ordem Divina (Taumaturgo) dá +1 truque e Segredos Mágicos abre outras listas no Bardo 10', () => {
    expect(limitesMagiasDnd(f('Clérigo', 1, { 'clerigo-n1-ordem-divina': 'taumaturgo' })).truques).toBe(4)
    expect(motivoBloqueio(m('fireball'), limitesMagiasDnd(f('Bardo', 9)), {})).toMatch(/lista/)
    expect(motivoBloqueio(m('fireball'), limitesMagiasDnd(f('Bardo', 10)), {})).toBeNull()
  })
  it('bloqueia nível sem espaço e limite cheio', () => {
    const l = limitesMagiasDnd(f('Mago', 1))
    expect(motivoBloqueio(m('fireball'), l, {})).toMatch(/3º/)
    const quatro = Object.fromEntries(['magic-missile', 'shield', 'sleep', 'mage-armor'].map(id => [id, 'preparada' as const]))
    expect(motivoBloqueio(m('burning-hands'), l, quatro)).toMatch(/preparadas \(4\)/)
    expect(motivoBloqueio(m('burning-hands'), l, { ...quatro, 'shield': 'extra' })).toBeNull()
  })
})

describe('validação no servidor (só o que mudou)', () => {
  it('aceita magia nova válida e extra de qualquer lista', () => {
    expect(validarAlteracoesMagiasDnd(f('Mago', 5), f('Mago', 5, {}, { fireball: 'preparada', 'cure-wounds': 'extra' }))).toEqual([])
  })
  it('recusa fora da lista, acima do nível e id desconhecido', () => {
    expect(validarAlteracoesMagiasDnd(f('Mago', 5), f('Mago', 5, {}, { 'cure-wounds': 'preparada' }))[0]).toMatch(/lista/)
    expect(validarAlteracoesMagiasDnd(f('Mago', 3), f('Mago', 3, {}, { fireball: 'preparada' }))[0]).toMatch(/3º/)
    expect(validarAlteracoesMagiasDnd(f('Mago', 3), { ...f('Mago', 3), dndMagias: { 'nao-existe': 'preparada' } as never })[0]).toMatch(/desconhecida/)
  })
  it('magias antigas continuam mesmo se o nível baixar', () => {
    const antes = f('Mago', 5, {}, { fireball: 'preparada' })
    expect(validarAlteracoesMagiasDnd(antes, { ...antes, campos: { classe: 'Mago', nivel: 3 } })).toEqual([])
  })
  it('lerMagiasDnd descarta lixo e normalizarFicha guarda limpo', () => {
    expect(lerMagiasDnd({ fireball: 'preparada', x: 'preparada', shield: 'outro', bless: 'extra' })).toEqual({ fireball: 'preparada', bless: 'extra' })
    const s = sistemaPorId('dnd5e-srd')!
    expect(normalizarFicha(s, { ...fichaVazia(s), dndMagias: { fireball: 'preparada', lixo: 'x' } as never }).dndMagias).toEqual({ fireball: 'preparada' })
  })
})

describe('rolagens', () => {
  it('dano cresce com o espaço e truque cresce com o nível do personagem', () => {
    expect(expressaoMagia(m('fireball'), { espaco: 3, nivelPersonagem: 5, mod: 3 })).toBe('8d6')
    expect(expressaoMagia(m('fireball'), { espaco: 5, nivelPersonagem: 9, mod: 3 })).toBe('10d6')
    expect(expressaoMagia(m('fire-bolt'), { nivelPersonagem: 1, mod: 3 })).toBe('1d10')
    expect(expressaoMagia(m('fire-bolt'), { nivelPersonagem: 11, mod: 3 })).toBe('3d10')
    expect(expressaoMagia(m('magic-missile'), { espaco: 1, nivelPersonagem: 1, mod: 3 })).toBe('1d4+1')
  })
  it('cura soma o modificador de conjuração', () => {
    expect(expressaoMagia(m('cure-wounds'), { espaco: 2, nivelPersonagem: 3, mod: 3 })).toBe('4d8+3')
  })
})
