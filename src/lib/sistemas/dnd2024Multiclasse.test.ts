import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { calcular, fichaVazia, normalizarFicha } from './calculo'
import { classesDaFicha, espacosDeMagia, lerMulticlasseDnd, requisitosMulticlasse, validarAlteracoesMulticlasseDnd } from './dnd2024Classes'
import { progressoDaFichaDnd, validarAlteracoesEscolhasDnd } from './dnd2024Ficha'
import { conjuradoresDnd, limitesMagiasDnd, motivoBloqueio, validarAlteracoesMagiasDnd } from './dnd2024Conjuracao'
import { magiaPorId } from './dnd2024Conjuracao'

const s = sistemaPorId('dnd5e-srd')!
const ficha = (campos: Record<string, string | number>, dndMulticlasse: Record<string, number> = {}, atributos: Record<string, number> = {}, extra: object = {}) => {
  const d = fichaVazia(s)
  Object.assign(d.campos, campos); Object.assign(d.atributos, atributos)
  return { ...d, dndMulticlasse, ...extra }
}

describe('classes da ficha', () => {
  it('sem multiclasse fica igual a antes', () => {
    const r = classesDaFicha({ campos: { classe: 'Mago', nivel: 5 } })
    expect(r.total).toBe(5); expect(r.lista.map(c => [c.cls.id, c.nivel])).toEqual([['mago', 5]])
    expect(progressoDaFichaDnd({ campos: { classe: 'Classe Inventada', nivel: 4 } }).nivelPorClasse).toEqual({ 'classe-inventada': 4 })
  })
  it('Guerreiro 5 / Mago 2 = nível total 7', () => {
    const r = classesDaFicha({ campos: { classe: 'Guerreiro', nivel: 7 }, dndMulticlasse: { mago: 2 } })
    expect(r.lista.map(c => [c.cls.id, c.nivel, c.principal])).toEqual([['guerreiro', 5, true], ['mago', 2, false]])
    expect(progressoDaFichaDnd({ campos: { classe: 'Guerreiro', nivel: 7 }, dndMulticlasse: { mago: 2 } }).nivelPorClasse).toEqual({ guerreiro: 5, mago: 2 })
  })
  it('lerMulticlasseDnd descarta a classe inicial, ids e níveis inválidos', () => {
    expect(lerMulticlasseDnd({ mago: 2, guerreiro: 1, xyz: 1, clerigo: 0, bardo: 2.5, ladino: 3 }, 'guerreiro')).toEqual({ mago: 2, ladino: 3 })
    const n = normalizarFicha(s, { ...fichaVazia(s), campos: { classe: 'Guerreiro', nivel: 3 }, dndMulticlasse: { mago: 1, lixo: 4 } as never })
    expect(n.dndMulticlasse).toEqual({ mago: 1 })
  })
})

describe('espaços de magia', () => {
  it('uma só classe conjuradora usa a tabela dela (Guerreiro 5 / Paladino 2 → 2 espaços de 1º)', () => {
    const e = espacosDeMagia(classesDaFicha({ campos: { classe: 'Guerreiro', nivel: 7 }, dndMulticlasse: { paladino: 2 } }).lista)
    expect(e.multiclasse).toBe(false); expect(e.espacos.slice(1, 3)).toEqual([2, 0])
  })
  it('Patrulheiro 4 / Feiticeiro 3 = conjurador 5 (exemplo do SRD): 4/3/2', () => {
    const e = espacosDeMagia(classesDaFicha({ campos: { classe: 'Patrulheiro', nivel: 7 }, dndMulticlasse: { feiticeiro: 3 } }).lista)
    expect(e.multiclasse).toBe(true); expect(e.nivelConjurador).toBe(5); expect(e.espacos.slice(1, 5)).toEqual([4, 3, 2, 0])
  })
  it('Paladino 3 arredonda para cima (2) e o Bruxo fica à parte no Pacto', () => {
    const e = espacosDeMagia(classesDaFicha({ campos: { classe: 'Paladino', nivel: 8 }, dndMulticlasse: { mago: 3, bruxo: 2 } }).lista)
    expect(e.nivelConjurador).toBe(5); expect(e.pacto).toBe(2); expect(e.pactoNivel).toBe(1)
  })
})

describe('efeitos com multiclasse (sem dobrar nada)', () => {
  it('salvaguardas só da classe inicial; recursos pelo nível de cada classe; proficiência pelo total', () => {
    const c = calcular(s, ficha({ classe: 'Guerreiro', nivel: 7, ca_base: 10 }, { barbaro: 2 }, { FOR: 16, CON: 14 }))
    expect(c.automaticos?.resist_forca).toBe('Guerreiro'); expect(c.automaticos?.resist_constituicao).toBe('Guerreiro')
    expect(c.recursosMax.furias).toBe(2); expect(c.recursosMax.surto_acao).toBe(1)
    expect(c.vars.dnd_prof).toBe(3); expect(c.vars.dnd_nivel).toBe(7)
  })
  it('PV: os níveis da outra classe usam a média do dado dela', () => {
    const so = calcular(s, ficha({ classe: 'Guerreiro', nivel: 5 }, {}, { CON: 10 })).derivados.pv_sugerido!
    const multi = calcular(s, ficha({ classe: 'Guerreiro', nivel: 5 }, { mago: 2 }, { CON: 10 })).derivados.pv_sugerido!
    // Guerreiro d10 (média 6) → Mago d6 (média 4): 2 níveis × −2
    expect(so - multi).toBe(4)
  })
  it('espaços da ficha seguem a tabela de multiclasse', () => {
    const c = calcular(s, ficha({ classe: 'Clérigo', nivel: 6 }, { mago: 3 }))
    expect([1, 2, 3, 4].map(n => c.recursosMax['espacos_' + n])).toEqual([4, 3, 3, 0])
  })
})

describe('validação da multiclasse', () => {
  const antes = ficha({ classe: 'Guerreiro', nivel: 4 }, {}, { FOR: 15, INT: 14 })
  it('aceita com 13+ nos atributos principais', () => {
    expect(validarAlteracoesMulticlasseDnd(antes, { ...antes, campos: { ...antes.campos, nivel: 5 }, dndMulticlasse: { mago: 1 } })).toEqual([])
  })
  it('recusa sem requisitos, mas o mestre pode liberar', () => {
    const fraco = ficha({ classe: 'Guerreiro', nivel: 4 }, {}, { FOR: 15, INT: 10 })
    const depois = { ...fraco, campos: { ...fraco.campos, nivel: 5 }, dndMulticlasse: { mago: 1 } }
    expect(validarAlteracoesMulticlasseDnd(fraco, depois)[0]).toMatch(/Inteligência 13/)
    expect(validarAlteracoesMulticlasseDnd(fraco, depois, { ignorarRequisitos: true })).toEqual([])
    expect(requisitosMulticlasse({ FOR: 10, DES: 13 }, ['guerreiro'])).toEqual([])
    expect(requisitosMulticlasse({ DES: 13, SAB: 12 }, ['monge'])[0]).toMatch(/Destreza e Sabedoria/)
  })
  it('a classe inicial precisa de 1 nível; classe inválida é recusada', () => {
    expect(validarAlteracoesMulticlasseDnd(antes, { ...antes, dndMulticlasse: { mago: 4 } })[0]).toMatch(/pelo menos 1 nível/)
    expect(validarAlteracoesMulticlasseDnd(antes, { ...antes, campos: { ...antes.campos, nivel: 5 }, dndMulticlasse: { necromante: 1 } })[0]).toMatch(/inválid/)
    expect(validarAlteracoesMulticlasseDnd(antes, { ...antes, campos: { ...antes.campos, nivel: 5 }, dndMulticlasse: { guerreiro: 1 } })[0]).toMatch(/inicial/)
  })
  it('a subclasse da segunda classe usa o nível dela', () => {
    const base = { campos: { classe: 'Guerreiro', nivel: 6 }, dndMulticlasse: { mago: 2 } }
    expect(validarAlteracoesEscolhasDnd(base, { ...base, dndEscolhas: { 'mago-subclasse': 'evocador' } })[0]).toMatch(/nível 3/)
    const tres = { campos: { classe: 'Guerreiro', nivel: 6 }, dndMulticlasse: { mago: 3 } }
    expect(validarAlteracoesEscolhasDnd(tres, { ...tres, dndEscolhas: { 'mago-subclasse': 'evocador' } })).toEqual([])
  })
})

describe('magias na multiclasse', () => {
  const d = { campos: { classe: 'Patrulheiro', nivel: 7 }, dndMulticlasse: { feiticeiro: 3 } }
  it('cada classe prepara como se fosse única (exemplo do SRD)', () => {
    const [pat, fei] = conjuradoresDnd(d)
    expect([pat.classeId, pat.preparadas, pat.nivelMax]).toEqual(['patrulheiro', 5, 1])
    expect([fei.classeId, fei.truques, fei.preparadas, fei.nivelMax]).toEqual(['feiticeiro', 4, 6, 2])
    expect(fei.espacoMax).toBe(3)
    expect(motivoBloqueio(magiaPorId('fireball')!, fei, {})).toMatch(/2º/)
    expect(motivoBloqueio(magiaPorId('misty-step')!, fei, {})).toBeNull()
    expect(limitesMagiasDnd(d).classeId).toBe('patrulheiro')
  })
  it('servidor aceita magia preparada pela segunda classe e recusa classe que não está na ficha', () => {
    expect(validarAlteracoesMagiasDnd(d, { ...d, dndMagias: { 'misty-step': 'preparada-feiticeiro', 'hunter-s-mark': 'preparada' } })).toEqual([])
    expect(validarAlteracoesMagiasDnd(d, { ...d, dndMagias: { 'misty-step': 'preparada' } })[0]).toMatch(/2º|lista/)
    expect(validarAlteracoesMagiasDnd(d, { ...d, dndMagias: { 'magic-missile': 'preparada-mago' } })[0]).toMatch(/não está na ficha/)
  })
})
