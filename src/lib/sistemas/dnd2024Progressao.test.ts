import { describe, expect, it } from 'vitest'
import { nivelTotal, progressaoVisivel, validarMarcos, type MarcoDnd } from './dnd2024Progressao'

const marcos: MarcoDnd[] = [
  { id: 'g1', nome: 'Marco automático de teste', nivel: 1, origem: 'classe', origemId: 'guerreiro', modo: 'automatico', fonte: 'teste' },
  { id: 'g3', nome: 'Escolha de teste', nivel: 3, origem: 'subclasse', origemId: 'guerreiro', modo: 'escolha', opcoes: [{ id: 'a', nome: 'A' }], fonte: 'teste' },
  { id: 'e5', nome: 'Traço de espécie de teste', nivel: 5, origem: 'especie', origemId: 'elfo', modo: 'automatico', fonte: 'teste' },
]
describe('progressão visual D&D sem gasto de pontos', () => {
  it('marca habilidades automáticas adquiridas e futuras', () => {
    const v = progressaoVisivel(marcos, { nivelPorClasse: { guerreiro: 1 }, especieId: 'elfo', escolhas: {} })
    expect(v.map(m => m.estado)).toEqual(['adquirido', 'futuro', 'futuro'])
  })
  it('solicita escolha no nível correto', () => {
    const v = progressaoVisivel(marcos, { nivelPorClasse: { guerreiro: 3 }, escolhas: {} })
    expect(v.find(m => m.id === 'g3')?.estado).toBe('escolher')
  })
  it('aceita apenas escolha catalogada', () => {
    const base = { nivelPorClasse: { guerreiro: 3 }, escolhas: { g3: 'a' } }
    expect(progressaoVisivel(marcos, base).find(m => m.id === 'g3')?.estado).toBe('adquirido')
    expect(progressaoVisivel(marcos, { ...base, escolhas: { g3: 'invalida' } }).find(m => m.id === 'g3')?.estado).toBe('pendente')
  })
  it('considera multiclasse para nível total, mas classe individual para marcos', () => {
    expect(nivelTotal({ guerreiro: 2, mago: 3 })).toBe(5)
    const v = progressaoVisivel(marcos, { nivelPorClasse: { guerreiro: 2, mago: 3 }, especieId: 'elfo', escolhas: {} })
    expect(v.find(m => m.id === 'g3')?.estado).toBe('futuro')
    expect(v.find(m => m.id === 'e5')?.estado).toBe('adquirido')
  })
  it('valida catálogo e não exige pontos para liberar automático', () => {
    expect(validarMarcos(marcos)).toEqual([])
    expect(validarMarcos([{ ...marcos[1], opcoes: [] }])).toContain('Escolha sem opções: g3')
  })
})
