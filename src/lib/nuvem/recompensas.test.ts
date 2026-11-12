import { describe, expect, it } from 'vitest'
import { aplicarRecompensa, descreverRecompensa, entradaDaBiblioteca, validarRecompensa, type EntradaBiblioteca } from './recompensas'
import { lerItens, lerPoderes, lerUso } from '../sistemas/inventario'

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
  it('D&D: XP no campo de XP, item vira item de verdade no inventário e moedas na carteira', () => {
    const d = aplicarRecompensa('dnd5e-srd', { campos: { xp: 100 }, listas: { anotacoes: '' } }, { xp: 50, item: 'Poção', moedas: '20 PO' })
    expect(Number((d.campos as Record<string, unknown>).xp)).toBe(150)
    const itens = lerItens(d.itens), uso = lerUso(d.uso)
    expect(itens.map(i => i.nome)).toEqual(['Poção']); expect(uso.itens[itens[0].id].qtd).toBe(1); expect(uso.carteira).toBe('+20 PO')
  })
  it('itens e poderes da biblioteca do mestre', () => {
    const espada = entradaDaBiblioteca({ id: '11111111-2222-3333-4444-555555555555', tipo: 'item', nome: 'Espada longa +1', dados: { categoria: 'arma', peso: 1.5, dano: '1d8+1', bonus: [] } })!
    const raio = entradaDaBiblioteca({ id: '99999999-2222-3333-4444-555555555555', tipo: 'poder', nome: 'Raio de gelo', dados: { tipo: 'magia', expressao: '1d10' } })!
    const bib: EntradaBiblioteca[] = [espada, raio]
    let d = aplicarRecompensa('dnd5e-srd', { campos: {}, listas: {} }, { xp: 0, item: '', moedas: '', biblioteca: bib })
    d = aplicarRecompensa('dnd5e-srd', d, { xp: 0, item: '', moedas: '', biblioteca: [espada] })
    const itens = lerItens(d.itens)
    expect(itens).toHaveLength(1); expect(itens[0].dano).toBe('1d8+1'); expect(lerUso(d.uso).itens[itens[0].id].qtd).toBe(2)
    expect(lerPoderes(d.poderes).map(p => p.nome)).toEqual(['Raio de gelo'])
    expect(entradaDaBiblioteca({ id: 'x', tipo: 'outro', nome: 'a', dados: {} })).toBeNull()
  })
  it('validação e descrição', () => {
    expect(validarRecompensa({})).toBeNull()
    expect(validarRecompensa({ xp: '300' })).toEqual({ xp: 300, item: '', moedas: '' })
    expect(descreverRecompensa({ xp: 300, item: 'Mapa', moedas: '5 PO' })).toBe('+300 XP, “Mapa”, 5 PO')
  })
})
