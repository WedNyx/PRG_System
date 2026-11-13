import { describe, expect, it } from 'vitest'
import { ARMAS_DND_2024, alcanceEmMetrosArmaDnd, armaDndPorId, atributoParaArmaDnd,
  expressaoDanoArmaDnd, pesoEmKgArmaDnd } from './dnd2024Armas'
import { lerItens, normalizarItem, transferirItem } from './inventario'
import { sistemaPorId } from './catalogo'
import { calcular, fichaVazia } from './calculo'
import { rolarExpressao } from '@/lib/dice'

const arma = (id: string) => {
  const a = armaDndPorId(id)
  if (!a) throw new Error('Arma ausente: ' + id)
  return a
}
describe('Catálogo de armas D&D 2024 (SRD 5.2.1)', () => {
  it('inclui todas as 38 armas sem ids repetidos e com os 4 grupos corretos', () => {
    expect(ARMAS_DND_2024).toHaveLength(38)
    expect(new Set(ARMAS_DND_2024.map(a => a.id)).size).toBe(38)
    expect(ARMAS_DND_2024.filter(a => a.grupo === 'simples-corpo')).toHaveLength(10)
    expect(ARMAS_DND_2024.filter(a => a.grupo === 'simples-distancia')).toHaveLength(4)
    expect(ARMAS_DND_2024.filter(a => a.grupo === 'marcial-corpo')).toHaveLength(18)
    expect(ARMAS_DND_2024.filter(a => a.grupo === 'marcial-distancia')).toHaveLength(6)
    for (const a of ARMAS_DND_2024) {
      expect(a.nome.length).toBeGreaterThan(1)
      expect(a.maestria).toMatch(/^(Slow|Nick|Push|Vex|Sap|Topple|Graze|Cleave)$/)
      expect(rolarExpressao(a.dano)).not.toBeNull()
      expect(pesoEmKgArmaDnd(a)).toBeGreaterThanOrEqual(0)
    }
  })
  it('aplica crítico só nos dados, nunca no modificador ou no encantamento', () => {
    const espada = arma('espada-longa')
    expect(expressaoDanoArmaDnd(espada, 3)).toBe('1d8+3')
    expect(expressaoDanoArmaDnd(espada, 3, true)).toBe('2d8+3')
    expect(expressaoDanoArmaDnd(espada, 3, true, true, 2)).toBe('2d10+5')
    expect(expressaoDanoArmaDnd(arma('espada-grande'), 4, true)).toBe('4d6+4')
    expect(expressaoDanoArmaDnd(arma('machado-grande'), -2, true)).toBe('2d12-2')
    expect(expressaoDanoArmaDnd(arma('zarabatana'), 2, true)).toBe('1+2')
  })
  it('respeita o ataque adicional com arma leve, sem bônus positivo do atributo', () => {
    expect(expressaoDanoArmaDnd(arma('adaga'), 4, false, false, 0, true)).toBe('1d4')
    expect(expressaoDanoArmaDnd(arma('adaga'), -2, true, false, 0, true)).toBe('2d4-2')
    expect(expressaoDanoArmaDnd(arma('espada-longa'), 4, false, false, 0, true)).toBe('1d8+4')
  })
  it('corpo a corpo usa FOR; distância usa DES; Acuidade permite escolher', () => {
    const mods = { FOR: 1, DES: 4 }
    expect(atributoParaArmaDnd(arma('machado-grande'), mods)).toEqual({ atributo: 'FOR', mod: 1 })
    expect(atributoParaArmaDnd(arma('arco-longo'), mods)).toEqual({ atributo: 'DES', mod: 4 })
    expect(atributoParaArmaDnd(arma('rapieira'), mods)).toEqual({ atributo: 'DES', mod: 4 })
    expect(atributoParaArmaDnd(arma('rapieira'), mods, 'FOR')).toEqual({ atributo: 'FOR', mod: 1 })
    expect(atributoParaArmaDnd(arma('dardo'), mods, 'FOR')).toEqual({ atributo: 'FOR', mod: 1 })
    expect(atributoParaArmaDnd(arma('machadinha'), mods, 'DES')).toEqual({ atributo: 'FOR', mod: 1 })
    expect(alcanceEmMetrosArmaDnd(arma('arco-longo'))).toBeGreaterThan(40)
  })
  it('arma catálogo sobrevive ao salvar/reabrir/transferir, sem perder meta e bônus', () => {
    const o = normalizarItem({
      id: 'espada1', nome: 'Espada longa +2', categoria: 'arma', peso: pesoEmKgArmaDnd(arma('espada-longa')),
      dano: '1d8', armaDnd: 'espada-longa', bonusArma: 2, bonus: [], magico: true,
    })
    expect(o).toMatchObject({ armaDnd: 'espada-longa', bonusArma: 2, magico: true })
    expect(lerItens([o])[0]).toMatchObject({ armaDnd: 'espada-longa', bonusArma: 2 })
    const moved = transferirItem({ itens: [o], uso: { itens: { espada1: { equipado: true, qtd: 1 } } } },
      { itens: [], uso: {} }, 'espada1', 1)
    if (!moved.ok) throw Error(moved.erro)
    expect(moved.para.itens?.[0]).toMatchObject({ armaDnd: 'espada-longa', bonusArma: 2 })
    expect((moved.para.uso as { itens: Record<string, { equipado: boolean }> }).itens.espada1.equipado).toBe(false)
    expect(normalizarItem({ nome: 'X', categoria: 'arma', armaDnd: 'id-falso', bonusArma: 3 })?.armaDnd).toBeUndefined()
    expect(normalizarItem({ nome: 'X', categoria: 'equipamento', armaDnd: 'espada-longa' })?.armaDnd).toBeUndefined()
  })
  it('encantamento é validado e não interfere no dano quando não existe', () => {
    const arma1 = normalizarItem({ nome: 'Martelo de guerra', categoria: 'arma', armaDnd: 'martelo-guerra', bonusArma: 9 })!
    expect(arma1.bonusArma).toBeUndefined()
    const magia = normalizarItem({ nome: 'Martelo +1', categoria: 'arma', armaDnd: 'martelo-guerra', bonusArma: 1 })!
    expect(magia.magico).toBe(true)
    const s = sistemaPorId('dnd5e-srd')!, d = fichaVazia(s)
    d.atributos.FOR = 16
    d.itens = [magia]
    d.uso = { itens: { [magia.id]: { equipado: true, qtd: 1 } } }
    const c = calcular(s, d)
    expect(expressaoDanoArmaDnd(arma('martelo-guerra'), c.mods.FOR, true, true, magia.bonusArma)).toBe('2d10+4')
  })
})
