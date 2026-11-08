import { describe, expect, it } from 'vitest'
import { aplicarRecompensa, descreverRecompensa, validarRecompensa } from './recompensas'

describe('recompensas', () => {
  it('Ficha V8: soma XP e anota itens no inventário', () => {
    const d = aplicarRecompensa('lunethernnyis-v8', { version: 2, fields: { xp: '250', inventory: 'Corda' } }, { xp: 100, item: 'Revólver', moedas: '20 moedas' }) as { fields: Record<string, string> }
    expect(d.fields.xp).toBe('350')
    expect(d.fields.inventory).toBe('Corda\n• Revólver\n💰 20 moedas')
  })
  it('sistema com campo XP (Lunethernnyis automático)', () => {
    const d = aplicarRecompensa('lunethernnyis', { campos: { xp: 0 }, listas: {} }, { xp: 300, item: '', moedas: '' }) as { campos: Record<string, number> }
    expect(d.campos.xp).toBe(300)
  })
  it('D&D (sem campo de XP): anota no inventário', () => {
    const d = aplicarRecompensa('dnd5e-srd', { campos: {}, listas: { inventario: '' } }, { xp: 50, item: 'Poção', moedas: '' }) as { listas: Record<string, string> }
    expect(d.listas.inventario).toBe('⭐ +50 XP\n• Poção')
  })
  it('validação e descrição', () => {
    expect(validarRecompensa({})).toBeNull()
    expect(validarRecompensa({ xp: '300' })).toEqual({ xp: 300, item: '', moedas: '' })
    expect(descreverRecompensa({ xp: 300, item: 'Mapa', moedas: '5 PO' })).toBe('+300 XP, “Mapa”, 5 PO')
  })
})
