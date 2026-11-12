import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { calcular, fichaVazia } from './calculo'
import { aplicarDescanso } from './descanso'

const s = sistemaPorId('dnd5e-srd')!
const ficha = (campos: Record<string, string | number>, atributos: Record<string, number> = {}, dndEscolhas: Record<string, string> = {}, pericias: Record<string, string> = {}) => {
  const d = fichaVazia(s)
  Object.assign(d.campos, campos); Object.assign(d.atributos, atributos); Object.assign(d.pericias, pericias)
  return { ...d, dndEscolhas }
}

describe('efeitos automáticos de D&D 2024 (sem bônus em dobro)', () => {
  it('Bárbaro 5: salvaguardas da classe, Fúrias pela tabela, Defesa sem Armadura e Movimento Rápido', () => {
    const c = calcular(s, ficha({ classe: 'Bárbaro', nivel: 5, ca_base: 10, deslocamento: 9 }, { FOR: 16, DES: 14, CON: 16 }))
    expect(c.pericias.resist_forca).toBe(3 + 3); expect(c.pericias.resist_constituicao).toBe(3 + 3); expect(c.pericias.resist_destreza).toBe(2)
    expect(c.automaticos?.resist_forca).toBe('Bárbaro')
    expect(c.recursosMax.furias).toBe(3); expect(c.recursosMax.espacos_1).toBe(0)
    expect(c.derivados.ca).toBe(10 + 2 + 3)
    expect(c.derivados.deslocamento_total).toBe(12)
  })
  it('marcar à mão não soma de novo; Especialista marcado continua valendo', () => {
    const c = calcular(s, ficha({ classe: 'Guerreiro', nivel: 1 }, { FOR: 14 }, {}, { resist_forca: 'proficiente', atletismo: 'especialista' }))
    expect(c.pericias.resist_forca).toBe(2 + 2)
    const c2 = calcular(s, ficha({ classe: 'Guerreiro', nivel: 1, antecedente: 'Soldado' }, { FOR: 14 }, {}, { atletismo: 'especialista' }))
    expect(c2.pericias.atletismo).toBe(2 + 4)
  })
  it('antecedente dá as perícias e o talento Alerta (Criminoso) soma a proficiência na Iniciativa', () => {
    const c = calcular(s, ficha({ classe: 'Ladino', nivel: 5, antecedente: 'Criminoso' }, { DES: 16 }))
    expect(c.pericias.furtividade).toBe(3 + 3); expect(c.automaticos?.furtividade).toBe('Criminoso')
    expect(c.derivados.iniciativa).toBe(3 + 3)
  })
  it('Bardo 2: Pau para Toda Obra só nas perícias sem proficiência', () => {
    const c = calcular(s, ficha({ classe: 'Bardo', nivel: 2 }, { INT: 10, CAR: 14 }, {}, { atuacao: 'proficiente' }))
    expect(c.pericias.historia).toBe(0 + 1); expect(c.pericias.atuacao).toBe(2 + 2); expect(c.pericias.resist_inteligencia).toBe(0)
    expect(c.recursosMax.inspiracao_bardo).toBe(2)
  })
  it('escolhas viram efeito: Sentidos Aguçados, Ordem Divina e Feitiçaria Dracônica', () => {
    const e = calcular(s, ficha({ classe: 'Mago', nivel: 1, especie: 'Elfo' }, { SAB: 12 }, { 'esp-elfo-sentidos': 'percepcao' }))
    expect(e.pericias.percepcao).toBe(1 + 2)
    const cl = calcular(s, ficha({ classe: 'Clérigo', nivel: 1 }, { INT: 10, SAB: 16 }, { 'clerigo-n1-ordem-divina': 'taumaturgo' }))
    expect(cl.pericias.arcanismo).toBe(0 + 3); expect(cl.pericias.religiao).toBe(0 + 3)
    const f = calcular(s, ficha({ classe: 'Feiticeiro', nivel: 3, ca_base: 10, dado_vida: 6 }, { DES: 14, CON: 10, CAR: 16 }, { 'feiticeiro-subclasse': 'feiticaria-draconica' }))
    expect(f.derivados.ca).toBe(10 + 2 + 3)
    const semDrac = calcular(s, ficha({ classe: 'Feiticeiro', nivel: 3, ca_base: 10 }, { DES: 14, CON: 10, CAR: 16 }))
    expect((f.derivados.pv_sugerido ?? 0) - (semDrac.derivados.pv_sugerido ?? 0)).toBe(3)
  })
  it('Monge 14 tem todas as salvaguardas; Mago 5 tem os espaços de magia da tabela; Bruxo usa Magia de Pacto', () => {
    const m = calcular(s, ficha({ classe: 'Monge', nivel: 14 }))
    for (const a of ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma']) expect(m.automaticos?.['resist_' + a]).toBeTruthy()
    expect(m.recursosMax.foco).toBe(14)
    const w = calcular(s, ficha({ classe: 'Mago', nivel: 5 }))
    expect([w.recursosMax.espacos_1, w.recursosMax.espacos_2, w.recursosMax.espacos_3, w.recursosMax.espacos_4]).toEqual([4, 3, 2, 0])
    const b = calcular(s, ficha({ classe: 'Bruxo', nivel: 5 }))
    expect(b.recursosMax.pacto).toBe(2); expect(b.recursosMax.espacos_1).toBe(0); expect(b.vars.dnd_pacto_nivel).toBe(3)
  })
  it('modo Manual desliga os efeitos', () => {
    const c = calcular(s, ficha({ classe: 'Bárbaro', nivel: 5, ca_base: 10 }, { DES: 14, CON: 16 }), { efeitosDnd: false })
    expect(c.pericias.resist_forca).toBe(0); expect(c.recursosMax.furias).toBe(0); expect(c.derivados.ca).toBe(12)
  })
  it('descanso curto enche Surto de Ação e Pontos de Foco; o longo enche o resto', () => {
    const d = { ...ficha({ classe: 'Guerreiro', nivel: 2 }), recursos: { surto_acao: { atual: 0 }, retomar_folego: { atual: 0 } } }
    const curto = aplicarDescanso(s, d, 'curto').d
    expect(curto.recursos.surto_acao.atual).toBe(1); expect(curto.recursos.retomar_folego.atual).toBe(0)
    expect(aplicarDescanso(s, d, 'longo').d.recursos.retomar_folego.atual).toBe(2)
  })
})
