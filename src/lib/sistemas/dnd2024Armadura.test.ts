import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { avaliar } from './formula'

const formula = sistemaPorId('dnd5e-srd')?.derivados.find(d => d.id === 'ca')?.formula
function classeDeArmadura(base: number, modDex: number, limite: number, escudo = 0) {
  if (!formula) throw new Error('Fórmula D&D de CA ausente')
  return avaliar(formula, { ca_base: base, mod_DES: modDex, des_max: limite, armadura: escudo })
}

describe('CA de armadura no D&D 2024', () => {
  it('não aplica modificador negativo de Destreza em armadura pesada', () => {
    expect(classeDeArmadura(16, -2, 0)).toBe(16)
  })
  it('respeita o limite de armadura média e inclui escudo', () => {
    expect(classeDeArmadura(14, 4, 2, 2)).toBe(18)
    expect(classeDeArmadura(14, -1, 2, 2)).toBe(15)
  })
  it('mantém Destreza integral na CA sem armadura', () => {
    expect(classeDeArmadura(10, 3, 10)).toBe(13)
  })
})
