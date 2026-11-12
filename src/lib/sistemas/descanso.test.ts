import { describe, expect, it } from 'vitest'
import { aplicarDescanso } from './descanso'
import { fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'

const s = sistemaPorId('dnd5e-srd')!
function ficha() {
  const d = fichaVazia(s, 'Lyra')
  return { ...d, recursos: { ...d.recursos, pv: { atual: 2 }, pv_temp: { atual: 5 }, dados_vida: { atual: 0 } },
    poderes: [{ id: 'f', nome: 'Fôlego', tipo: 'habilidade', usosMax: 1, recarga: 'curto' }, { id: 'b', nome: 'Bola de fogo', tipo: 'magia', usosMax: 2 }],
    uso: { itens: {}, poderes: { f: 1, b: 2 }, carteira: '' } }
}

describe('descanso', () => {
  it('longo: vida e recursos cheios, temporários zeram, todos os usos voltam', () => {
    const r = aplicarDescanso(s, ficha(), 'longo')
    const max = fichaVazia(s, 'x').recursos.pv?.atual
    expect(r.d.recursos.pv.atual).toBe(max)
    expect(r.d.recursos.pv_temp.atual).toBe(0)
    expect(r.d.recursos.dados_vida.atual).toBe(1)
    expect((r.d.uso as { poderes: Record<string, number> }).poderes).toEqual({})
    expect(r.mudancas.some(m => m.startsWith('Pontos de Vida: 2 →'))).toBe(true)
  })
  it('curto: só voltam os poderes de descanso curto e a cura informada', () => {
    const r = aplicarDescanso(s, ficha(), 'curto', { cura: 4 })
    expect(r.d.recursos.pv.atual).toBe(6)
    expect(r.d.recursos.pv_temp.atual).toBe(5)
    expect((r.d.uso as { poderes: Record<string, number> }).poderes).toEqual({ b: 2 })
    expect(r.mudancas).toContain('Usos de Fôlego recuperados')
  })
  it('curto: a cura não passa do máximo e ficha cheia não muda nada', () => {
    const max = fichaVazia(s, 'x').recursos.pv!.atual
    expect(aplicarDescanso(s, ficha(), 'curto', { cura: 999 }).d.recursos.pv.atual).toBe(max)
    const cheia = aplicarDescanso(s, ficha(), 'longo').d
    expect(aplicarDescanso(s, cheia, 'longo').mudancas).toEqual([])
  })
})

describe('marcadores no descanso (v0.32.10)', () => {
  it('Exaustão começa em 0 e cai 1 no descanso longo; Morrendo zera; PV enche', async () => {
    const { sistemaPorId } = await import('./catalogo')
    const { fichaVazia } = await import('./calculo')
    const dnd = sistemaPorId('dnd5e-srd')!, d = fichaVazia(dnd)
    expect(d.recursos.exaustao.atual).toBe(0); expect(d.recursos.inspiracao.atual).toBe(0)
    d.recursos.exaustao = { atual: 3 }; d.recursos.pv = { atual: 1 }
    const r = aplicarDescanso(dnd, d, 'longo')
    expect(r.d.recursos.exaustao.atual).toBe(2); expect(r.d.recursos.pv.atual).toBeGreaterThan(1)
    const pf = sistemaPorId('pf2e')!, p = fichaVazia(pf)
    expect(p.recursos.morrendo.atual).toBe(0)
    p.recursos.morrendo = { atual: 2 }; p.recursos.ferido = { atual: 1 }
    const r2 = aplicarDescanso(pf, p, 'longo')
    expect(r2.d.recursos.morrendo.atual).toBe(0); expect(r2.d.recursos.ferido.atual).toBe(0)
  })
})
