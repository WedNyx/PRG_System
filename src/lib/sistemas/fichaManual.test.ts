import { describe, expect, it } from 'vitest'
import { calcular, fichaVazia, normalizarFicha, tornarManual } from './calculo'
import { SISTEMAS } from './catalogo'
import { caminhos, categoria, diferencas } from '../nuvem/categorias'

const sis = (id: string) => SISTEMAS.find(s => s.id === id)!

describe('ficha manual (v0.34.8)', () => {
  it('a primeira vez guarda os números que a ficha já mostrava', () => {
    const s = sis('dnd5e-srd')
    const d = normalizarFicha(s, { ...fichaVazia(s), atributos: { FOR: 8, DES: 14, CON: 13, INT: 17, SAB: 12, CAR: 10 } })
    const antes = calcular(s, d)
    const m = tornarManual(s, d)
    const depois = calcular(s, m)
    expect(depois.mods).toEqual(antes.mods)
    expect(depois.derivados.ca).toBe(antes.derivados.ca)
    expect(m.recursos.pv?.max).toBe(antes.recursosMax.pv ?? m.recursos.pv?.max)
  })

  it('depois disso nada é calculado: mudar o atributo não mexe no modificador nem na CA', () => {
    const s = sis('dnd5e-srd')
    const m = tornarManual(s, fichaVazia(s))
    const ca = calcular(s, m).derivados.ca
    const outra = { ...m, atributos: { ...m.atributos, DES: 20 } }
    expect(calcular(s, outra).mods.DES).toBe(m.manual!.mods.DES)
    expect(calcular(s, outra).derivados.ca).toBe(ca)
  })

  it('usa exatamente o que foi digitado (modificador, valores, perícias e máximos)', () => {
    const s = sis('tormenta20')
    const m = tornarManual(s, fichaVazia(s))
    const d = { ...m, atributos: { ...m.atributos, FOR: 4 }, manual: { mods: { ...m.manual!.mods }, derivados: { ...m.manual!.derivados, defesa: 21 }, pericias: { ...m.manual!.pericias, luta: 9 } },
      recursos: { ...m.recursos, pv: { atual: 10, max: 42 } } }
    const c = calcular(s, d)
    expect(c.mods.FOR).toBe(4) // Tormenta20: o atributo já é o modificador
    expect(c.derivados.defesa).toBe(21)
    expect(c.pericias.luta).toBe(9)
    expect(c.recursosMax.pv).toBe(42)
    expect(c.limites).toEqual([])
    const dnd = sis('dnd5e-srd'), x = tornarManual(dnd, fichaVazia(dnd))
    expect(calcular(dnd, { ...x, manual: { ...x.manual!, mods: { ...x.manual!.mods, FOR: 7 } } }).mods.FOR).toBe(7)
  })

  it('perícias em porcentagem usam o valor digitado', () => {
    const s = sis('brp')
    const m = tornarManual(s, fichaVazia(s))
    const id = s.pericias!.lista[0].id
    expect(calcular(s, { ...m, pericias: { ...m.pericias, [id]: 63 } }).pericias[id]).toBe(63)
  })

  it('normalizar preserva os números digitados e limpa o que não é do sistema', () => {
    const s = sis('fate-core')
    const m = tornarManual(s, fichaVazia(s))
    const sujo = { ...m, manual: { ...m.manual!, derivados: { ...m.manual!.derivados, invasor: 99 } } }
    const n = normalizarFicha(s, sujo)
    expect(n.manual).toBeDefined()
    expect(Object.keys(n.manual!.derivados)).not.toContain('invasor')
  })

  it('campanha: os números digitados seguem as permissões de atributos, perícias e recursos', () => {
    const s = sis('dnd5e-srd')
    const a = tornarManual(s, fichaVazia(s))
    const b = { ...a, manual: { ...a.manual!, mods: { ...a.manual!.mods, FOR: 5 }, pericias: { ...a.manual!.pericias, atletismo: 7 } } }
    expect(caminhos('dnd5e-srd', a as unknown as Record<string, unknown>)).toContain('manual.mods')
    expect(categoria('dnd5e-srd', 'manual.mods')).toBe('atributos')
    expect(categoria('dnd5e-srd', 'manual.pericias')).toBe('pericias')
    expect(categoria('dnd5e-srd', 'manual.derivados')).toBe('pv')
    expect(diferencas('dnd5e-srd', a as unknown as Record<string, unknown>, b as unknown as Record<string, unknown>).map(x => x.caminho).sort()).toEqual(['manual.mods', 'manual.pericias'])
  })

  it('todos os sistemas visíveis viram manuais sem erro', () => {
    for (const s of SISTEMAS.filter(x => !x.oculto)) {
      const m = tornarManual(s, fichaVazia(s))
      expect(m.manual, s.id).toBeDefined()
      expect(() => calcular(s, m), s.id).not.toThrow()
    }
  })
})
