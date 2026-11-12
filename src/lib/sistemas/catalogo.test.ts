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

describe('revisão das fichas (v0.8.0)', () => {
  it('D&D: CA com armadura respeita o limite de Destreza e PV pela média', () => {
    const s = sistemaPorId('dnd5e-srd')!, d = fichaVazia(s)
    d.atributos.DES = 16; d.atributos.CON = 14
    expect(calcular(s, d).derivados.ca).toBe(13) // sem armadura: 10 + 3
    Object.assign(d.campos, { ca_base: 14, des_max: 2, armadura: 2 }) // meia armadura + escudo
    expect(calcular(s, d).derivados.ca).toBe(18)
    Object.assign(d.campos, { dado_vida: 10, nivel: 3 })
    expect(calcular(s, d).derivados.pv_sugerido).toBe(10 + 2 + 2 * (6 + 2))
  })
  it('PF2e: PV e CA pelas regras do Remaster', () => {
    const s = sistemaPorId('pf2e')!, d = fichaVazia(s)
    Object.assign(d.campos, { pv_ancestralidade: 8, pv_classe: 10, nivel: 1 }); d.atributos.CON = 2; d.atributos.DES = 3
    const c = calcular(s, d)
    expect(c.derivados.pv_max).toBe(20); expect(c.recursosMax.pv).toBe(20)
    expect(c.derivados.ca).toBe(10 + 3 + 0 + 2 + 1)
    Object.assign(d.campos, { des_max: 1, armadura: 4 })
    expect(calcular(s, d).derivados.ca).toBe(10 + 1 + 4 + 3)
  })
  it('Fate: pirâmide de perícias', () => {
    const s = sistemaPorId('fate-core')!, d = fichaVazia(s)
    d.pericias.lutar = 'otimo'; d.pericias.atirar = 'otimo'
    expect(calcular(s, d).limites.find(l => l.nome.includes('Ótimas'))?.excedido).toBe(true)
  })
  it('Blades: 7 pontos de ação e no máximo 2 por ação na criação', () => {
    const s = sistemaPorId('blades')!, d = fichaVazia(s)
    Object.assign(d.pericias, { cacar: 'd2', estudar: 'd2', finesse: 'd2', comandar: 'd1' })
    let c = calcular(s, d)
    expect(c.limites.every(l => !l.excedido)).toBe(true); expect(c.derivados.perspicacia).toBe(2)
    d.pericias.cacar = 'd3'
    c = calcular(s, d)
    expect(c.limites.filter(l => l.excedido).length).toBe(2)
  })
})

describe('fichas revisadas (v0.32.10)', () => {
  it('Tormenta20: Guerreiro nível 3 com Con 2 → PV 34, PM 9; Arcanista com Int 4 → PM 18 + Int, CD 15', () => {
    const s = sistemaPorId('tormenta20')!; const d = fichaVazia(s)
    d.campos.classe = 'Guerreiro'; d.campos.nivel = 3; d.atributos.CON = 2
    let c = calcular(s, d)
    expect(c.derivados.pv_max).toBe(20 + 2 + 2 * (5 + 2)); expect(c.derivados.pm_max).toBe(9)
    expect(c.recursosMax.pv).toBe(36); expect(c.recursosMax.pm).toBe(9)
    d.campos.classe = 'arcanista'; d.campos.atributo_magia = 'Inteligência'; d.atributos.INT = 4
    c = calcular(s, d)
    expect(c.derivados.pm_max).toBe(18 + 4); expect(c.derivados.cd_magias).toBe(10 + 1 + 4)
    d.campos.armadura_tipo = 'Pesada'; d.atributos.DES = 3; d.campos.defesa_bonus = 5
    expect(calcular(s, d).derivados.defesa).toBe(15)
    d.recursos.pv = { atual: 10, max: 50 }
    expect(calcular(s, d).recursosMax.pv).toBe(50) // máximo digitado vale
  })
  it('Tormenta20: sem classe, PV fica para preencher; carga com Força negativa', () => {
    const s = sistemaPorId('tormenta20')!; const d = fichaVazia(s)
    expect(calcular(s, d).recursosMax.pv).toBeNull()
    d.atributos.FOR = -1; expect(calcular(s, d).carga.max).toBe(9)
    d.atributos.FOR = 3; expect(calcular(s, d).carga.max).toBe(16)
  })
  it('Ordem Paranormal: Combatente NEX 10% → PV 20+Vig+4+Vig, PE, SAN, DT e Defesa', () => {
    const s = sistemaPorId('ordem-paranormal')!; const d = fichaVazia(s)
    d.campos.classe = 'Combatente'; d.campos.nex = 10; Object.assign(d.atributos, { VIG: 3, PRE: 2, AGI: 2 })
    const c = calcular(s, d)
    expect(c.derivados.nivel).toBe(2)
    expect(c.derivados.pv_max).toBe(20 + 3 + 4 + 3); expect(c.derivados.pe_max).toBe(2 + 2 + 2 + 2); expect(c.derivados.san_max).toBe(15)
    expect(c.derivados.dt_rituais).toBe(14); expect(c.derivados.defesa).toBe(12)
    d.campos.nex = 99; expect(calcular(s, d).derivados.nivel).toBe(20)
    d.campos.nex = 95; expect(calcular(s, d).derivados.nivel).toBe(19)
  })
  it('Ordem Paranormal: atributos 9 pontos na criação, 10 em NEX 20%', () => {
    const s = sistemaPorId('ordem-paranormal')!; const d = fichaVazia(s)
    Object.assign(d.atributos, { AGI: 3, FOR: 0, INT: 2, PRE: 2, VIG: 3 })
    expect(calcular(s, d).limites[0].excedido).toBe(true)
    d.campos.nex = 20; expect(calcular(s, d).limites[0].excedido).toBe(false)
  })
  it('Ordem Paranormal: ficha antiga com campos.defesa migra para "Outros bônus de Defesa" (v0.33.0)', async () => {
    const { normalizarFicha } = await import('./calculo')
    const s = sistemaPorId('ordem-paranormal')!
    const n = normalizarFicha(s, { atributos: { AGI: 2 }, campos: { defesa: 18 } } as never)
    expect(n.campos.defesa).toBeUndefined(); expect(n.campos.defesa_outros).toBe(6) // 18 = 10 + AGI(2) + 6
    expect(calcular(s, n).derivados.defesa).toBe(18)
    // Ficha já na migrada (ou nova) não é tocada de novo.
    const n2 = normalizarFicha(s, { campos: { defesa: 18, defesa_outros: 0 } } as never)
    expect(n2.campos.defesa_outros).toBe(0)
  })
  it('D&D 5e: classe define o Dado de Vida e a magia; anão +1 PV por nível', () => {
    const s = sistemaPorId('dnd5e-srd')!; const d = fichaVazia(s)
    d.campos.classe = 'Mago'; d.campos.nivel = 3; Object.assign(d.atributos, { CON: 14, INT: 16 })
    let c = calcular(s, d)
    expect(c.derivados.pv_sugerido).toBe(6 + 2 + 2 * (4 + 2)); expect(c.derivados.cd_magia).toBe(8 + 2 + 3); expect(c.derivados.ataque_magia).toBe(5)
    d.campos.especie = 'Anão'; c = calcular(s, d)
    expect(c.derivados.pv_sugerido).toBe(20 + 3); expect(c.recursosMax.pv).toBe(23)
    d.campos.classe = ''; d.campos.dado_vida = 10; d.campos.especie = ''
    expect(calcular(s, d).derivados.pv_sugerido).toBe(10 + 2 + 2 * (6 + 2))
  })
  it('Pathfinder 2e: ancestralidade e classe somam PV; CD de classe e de magia', () => {
    const s = sistemaPorId('pf2e')!; const d = fichaVazia(s)
    d.campos.ancestralidade = 'Anão'; d.campos.classe = 'Clérigo'; d.campos.nivel = 2; d.atributos.CON = 2; d.atributos.SAB = 4
    d.campos.atributo_chave = 'Sabedoria'; d.campos.atributo_magia = 'Sabedoria'; d.campos.grau_magia = 2
    const c = calcular(s, d)
    expect(c.derivados.pv_max).toBe(10 + (8 + 2) * 2)
    expect(c.derivados.cd_classe).toBe(10 + 4 + 2 + 2); expect(c.derivados.cd_magia).toBe(18); expect(c.derivados.ataque_magia).toBe(8)
  })
})

describe('fichas revisadas, parte 2 (v0.33.0)', () => {
  it('Fate: estresse começa vazio; Vigor Bom = 4 caixas; façanhas extras tiram recarga', () => {
    const s = sistemaPorId('fate-core')!; const d = fichaVazia(s)
    expect(d.recursos.estresse_fisico.atual).toBe(0)
    d.pericias.vigor = 'bom'; d.campos.facanhas_extras = 1
    const c = calcular(s, d)
    expect(c.recursosMax.estresse_fisico).toBe(4); expect(c.derivados.recarga_atual).toBe(2); expect(c.recursosMax.pontos_destino).toBe(2)
    d.pericias.vigor = 'excepcional'; expect(calcular(s, d).derivados.consequencia_extra).toBe(1)
  })
  it('Blades: estresse e trauma começam em 0; resistência pelo número de ações; carga escolhida', () => {
    const s = sistemaPorId('blades')!; const d = fichaVazia(s)
    expect(d.recursos.estresse.atual).toBe(0); expect(d.recursos.trauma.atual).toBe(0)
    d.pericias.escaramucar = 'd2'; d.pericias.rondar = 'd1'; d.campos.carga_escolhida = 'Leve (3)'
    const c = calcular(s, d)
    expect(c.derivados.proeza).toBe(2); expect(c.carga.max).toBe(3); expect(c.pericias.escaramucar).toBe(2)
  })
  it('BRP: ficha nova já vem com o valor-base; APA antigo vira CAR; ferimento grave', async () => {
    const { normalizarFicha } = await import('./calculo')
    const s = sistemaPorId('brp')!; const d = fichaVazia(s)
    expect(d.pericias.escalar).toBe(40); expect(d.pericias.esquivar).toBe(20); expect(d.pericias.idioma_proprio).toBe(65); expect(d.pericias.primeiros_socorros).toBe(30)
    expect(s.pericias!.lista.find(p => p.id === 'escalar')!.nome).toBe('Escalar (40%)')
    const n = normalizarFicha(s, { atributos: { APA: 14, CON: 12, TAM: 15 } } as never)
    expect(n.atributos.CAR).toBe(14); expect(n.atributos.APA).toBeUndefined()
    const c = calcular(s, n)
    expect(c.derivados.pv_max).toBe(14); expect(c.derivados.ferimento_grave).toBe(7); expect(c.derivados.charme).toBe(70)
  })
})
