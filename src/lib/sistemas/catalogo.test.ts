import { describe, expect, it } from 'vitest'
import { SISTEMAS, sistemaPorId } from './catalogo'
import { calcular, fichaVazia } from './calculo'
import { avaliar } from './formula'

describe('catálogo de sistemas', () => {
  it('todos os modelos calculam sem fórmulas inválidas', () => {
    for (const s of SISTEMAS) {
      const c = calcular(s, fichaVazia(s))
      for (const [k, v] of Object.entries(c.derivados)) expect(v, `${s.id}.${k}`).not.toBeNull()
      for (const [k, v] of Object.entries(c.pericias)) expect(v, `${s.id}.${k}`).not.toBeNull()
      for (const r of s.recursos) if (r.formula) expect(c.recursosMax[r.id], `${s.id}.${r.id}`).not.toBeNull()
      for (const t of s.pericias?.treinos ?? []) expect(() => avaliar(t.formula, c.vars), `${s.id}.${t.id}`).not.toThrow()
    }
  })
  it('ids únicos', () => {
    expect(new Set(SISTEMAS.map(s => s.id)).size).toBe(SISTEMAS.length)
    for (const s of SISTEMAS) expect(new Set(s.pericias?.lista.map(p => p.id)).size).toBe(s.pericias?.lista.length ?? 0)
  })
})

describe('Lunethernnyis', () => {
  const s = sistemaPorId('lunethernnyis')!
  it('ficha inicial: PV 30, Defesa 11, nível 1, sem limites estourados', () => {
    const c = calcular(s, fichaVazia(s))
    expect(c.derivados.pv_max).toBe(30); expect(c.derivados.defesa).toBe(11); expect(c.derivados.nivel).toBe(1)
    expect(c.limites.every(l => !l.excedido)).toBe(true)
  })
  it('distribuição de criação: +6 pontos, um atributo 0 dá +1', () => {
    const d = fichaVazia(s)
    Object.assign(d.atributos, { POT: 3, DES: 3, REF: 3, TEN: 2, ENG: 1, VON: 1, SIN: 0 }) // 13 - 7 = 6... +1 pelo zero
    let c = calcular(s, d)
    expect(c.limites.find(l => l.nome.startsWith('Pontos de atributo'))).toMatchObject({ uso: 6, max: 7, excedido: false })
    d.atributos.ENG = 3
    c = calcular(s, d)
    expect(c.limites.find(l => l.nome.startsWith('Pontos de atributo'))?.excedido).toBe(true)
  })
  it('perícias: custo 1/3/6 e só um Exímio', () => {
    const d = fichaVazia(s)
    d.pericias.confronto = 'eximio'; d.pericias.pontaria = 'praticante'; d.pericias.guarda = 'praticante'
    let c = calcular(s, d)
    expect(c.vars.custo_pericias).toBe(8); expect(c.pericias.confronto).toBe(9)
    d.pericias.medicina = 'eximio'
    c = calcular(s, d)
    expect(c.limites.find(l => l.nome.startsWith('Perícias Exímias'))?.excedido).toBe(true)
  })
  it('XP → nível e limite de atributo (3 / 4 / 5)', () => {
    const d = fichaVazia(s)
    const nivel = (xp: number) => { d.campos.xp = xp; const c = calcular(s, d); return [c.derivados.nivel, c.derivados.limite_atributo] }
    expect(nivel(0)).toEqual([1, 3]); expect(nivel(299)).toEqual([1, 3]); expect(nivel(300)).toEqual([2, 3])
    expect(nivel(1350)).toEqual([4, 4]); expect(nivel(5250)).toEqual([8, 5]); expect(nivel(8100)).toEqual([10, 5])
  })
  it('PV = 25 + TEN × 5', () => {
    const d = fichaVazia(s); d.atributos.TEN = 5
    expect(calcular(s, d).derivados.pv_max).toBe(50)
  })
})

describe('D&D 5e', () => {
  const s = sistemaPorId('dnd5e-srd')!
  it('modificadores, proficiência e perícias', () => {
    const d = fichaVazia(s)
    Object.assign(d.atributos, { DES: 16, SAB: 13 }); d.campos.nivel = 5
    d.pericias.furtividade = 'especialista'; d.pericias.percepcao = 'proficiente'
    const c = calcular(s, d)
    expect(c.mods.DES).toBe(3); expect(c.derivados.prof).toBe(3)
    expect(c.pericias.furtividade).toBe(9); expect(c.pericias.percepcao).toBe(4)
    expect(c.derivados.ca).toBe(13); expect(c.derivados.percepcao_passiva).toBe(14)
  })
})

describe('outros', () => {
  it('Pathfinder: treinado = nível + 2 + atributo', () => {
    const s = sistemaPorId('pf2e')!; const d = fichaVazia(s)
    d.campos.nivel = 3; d.atributos.DES = 4; d.pericias.acrobatismo = 'treinado'
    expect(calcular(s, d).pericias.acrobatismo).toBe(9)
  })
  it('Tormenta20: treinado nível 7 = 3 + 4 + atributo', () => {
    const s = sistemaPorId('tormenta20')!; const d = fichaVazia(s)
    d.campos.nivel = 7; d.atributos.DES = 3; d.pericias.reflexos = 'treinado'
    expect(calcular(s, d).pericias.reflexos).toBe(10)
  })
  it('Fate: estresse físico cresce com Vigor', () => {
    const s = sistemaPorId('fate-core')!; const d = fichaVazia(s)
    expect(calcular(s, d).recursosMax.estresse_fisico).toBe(2)
    d.pericias.vigor = 'regular'; expect(calcular(s, d).recursosMax.estresse_fisico).toBe(3)
    d.pericias.vigor = 'bom'; expect(calcular(s, d).recursosMax.estresse_fisico).toBe(4)
  })
  it('BRP: PV = teto((CON+TAM)/2)', () => {
    const s = sistemaPorId('brp')!; const d = fichaVazia(s)
    Object.assign(d.atributos, { CON: 11, TAM: 14 })
    expect(calcular(s, d).derivados.pv_max).toBe(13)
  })
  it('Blades: dados de resistência contam ações com pontos', () => {
    const s = sistemaPorId('blades')!; const d = fichaVazia(s)
    d.pericias.cacar = 'd2'; d.pericias.estudar = 'd1'
    expect(calcular(s, d).derivados.perspicacia).toBe(2)
  })
})

describe('Faroeste Arcano', () => {
  const s = sistemaPorId('faroeste-arcano')!
  it('pistoleiro nível 5: BBA +6, CA de classe +2, Fort +3', () => {
    const d = fichaVazia(s); d.campos.nivel_pistoleiro = 5; d.atributos.CON = 14; d.atributos.DES = 14
    const c = calcular(s, d)
    expect(c.derivados.bba).toBe(6); expect(c.derivados.fortitude).toBe(5)
    expect(c.derivados.ca).toBe(10 + 2 + 2); expect(c.derivados.iniciativa).toBe(2 + 4)
  })
  it('multiclasse soma as tabelas', () => {
    const d = fichaVazia(s); d.campos.nivel_desgarrado = 3; d.campos.nivel_rastreador = 2
    const c = calcular(s, d)
    expect(c.derivados.nivel).toBe(5); expect(c.derivados.bba).toBe(1 + 2); expect(c.derivados.reflexos).toBe(3 + 0)
  })
  it('Atletismo usa o melhor entre FOR e DES', () => {
    const d = fichaVazia(s); d.atributos.FOR = 8; d.atributos.DES = 16; d.pericias.atletismo = 4
    expect(calcular(s, d).pericias.atletismo).toBe(7)
  })
  it('avisa graduação acima do máximo', () => {
    const d = fichaVazia(s); d.campos.nivel_pistoleiro = 1; d.pericias.cavalgar = 5
    expect(calcular(s, d).limites[0].excedido).toBe(true)
  })
})
