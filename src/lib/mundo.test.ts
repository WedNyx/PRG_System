import { describe, expect, it } from 'vitest'
import { lerMundo, mundoParaJogador, posicaoNaTeia } from './mundo'

const img = 'https://x.supabase.co/storage/v1/object/public/prg-mesa/c/mapa.jpg'
describe('mundo da campanha', () => {
  it('limpa páginas e relações', () => {
    const m = lerMundo({ versao: 3, mapa: img, paginas: [
      { id: 'a', nome: 'Valmor', tipo: 'lugar', icone: '🏰', mapa: { x: 30, y: 140 }, imagem: 'https://evil.com/x.png' },
      { id: 'b', nome: 'Vex', tipo: 'npc', icone: '<b>', oculto: true, teia: { x: 10, y: 20 } },
      { id: 'a', nome: 'Duplicada' }, { id: 'c', nome: '' }, { id: 'bad id!', nome: 'X' }],
      relacoes: [{ id: 'r1', de: 'a', para: 'b', tipo: 'inimigo', rotulo: 'quer o trono' }, { id: 'r2', de: 'a', para: 'zz' }, { id: 'r3', de: 'a', para: 'a' }] })
    expect(m.mapa).toBe(img)
    expect(m.paginas.map(p => p.id)).toEqual(['a', 'b'])
    expect(m.paginas[0].mapa).toEqual({ x: 30, y: 100 })
    expect(m.paginas[0].imagem).toBeUndefined()
    expect(m.paginas[1].icone).toBe('👤')
    expect(m.relacoes.map(r => r.id)).toEqual(['r1'])
  })
  it('jogador não vê o que é só do mestre', () => {
    const m = lerMundo({ paginas: [{ id: 'a', nome: 'A' }, { id: 'b', nome: 'B', oculto: true }, { id: 'c', nome: 'C' }],
      relacoes: [{ id: 'r1', de: 'a', para: 'b' }, { id: 'r2', de: 'a', para: 'c', oculto: true }, { id: 'r3', de: 'c', para: 'a' }] })
    const j = mundoParaJogador(m)
    expect(j.paginas.map(p => p.id)).toEqual(['a', 'c']); expect(j.relacoes.map(r => r.id)).toEqual(['r3'])
  })
  it('posição inicial na teia fica dentro do quadro', () => {
    for (let i = 0; i < 8; i++) { const p = posicaoNaTeia(i, 8); expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(1000); expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(700) }
  })
})
