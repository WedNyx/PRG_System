import { describe, expect, it } from 'vitest'
import { caminhoIluminado, CICLO, idadeDaLua, infoLua } from './lua'

describe('lua dinâmica', () => {
  it('acerta luas conhecidas (margem de 1 dia)', () => {
    // Lua cheia: 15/11/2024 21:28 UTC · Lua nova: 1/11/2024 12:47 UTC · Quarto crescente: 8/12/2024 15:26 UTC
    expect(infoLua(new Date(Date.UTC(2024, 10, 15, 21))).fase.id).toBe('cheia')
    expect(infoLua(new Date(Date.UTC(2024, 10, 1, 13))).fase.id).toBe('nova')
    expect(infoLua(new Date(Date.UTC(2024, 11, 8, 15))).fase.id).toBe('quarto-crescente')
    expect(infoLua(new Date(Date.UTC(2024, 10, 15, 21))).iluminada).toBeGreaterThan(0.98)
  })
  it('as 8 fases aparecem ao longo do ciclo', () => {
    const vistas = new Set<string>()
    for (let h = 0; h < 30 * 24; h += 6) vistas.add(infoLua(new Date(Date.UTC(2026, 0, 1) + h * 3600_000)).fase.id)
    expect(vistas.size).toBe(8)
  })
  it('próxima cheia e próxima nova ficam no futuro, dentro de um ciclo', () => {
    const agora = new Date(Date.UTC(2026, 10, 11))
    const i = infoLua(agora)
    for (const d of [i.proximaCheia, i.proximaNova]) {
      expect(d.getTime()).toBeGreaterThan(agora.getTime())
      expect(d.getTime() - agora.getTime()).toBeLessThanOrEqual(29.6 * 86_400_000)
    }
    const n = idadeDaLua(i.proximaNova); expect(Math.min(n, CICLO - n)).toBeLessThan(0.01)
  })
  it('desenho: crescente acesa à esquerda no sul e à direita no norte', () => {
    expect(caminhoIluminado(0.1, 50, true)).toContain('A50 50 0 0 0 0 50')
    expect(caminhoIluminado(0.1, 50, false)).toContain('A50 50 0 0 1 0 50')
    expect(caminhoIluminado(0.25, 50)).toContain('A0 50')
  })
})
