import { describe, expect, it } from 'vitest'
import { ESPECIAIS, MOLDURAS, podeUsarMoldura } from './molduras'
import { colorsetDe, DADO_PADRAO, ESTILOS_DADOS, estiloDado } from './estilosDados'
import { limparVisual } from './visual'

describe('molduras (v0.37.1)', () => {
  it('ids únicos e as livres liberadas para todos', () => {
    expect(new Set(MOLDURAS.map(m => m.id)).size).toBe(MOLDURAS.length)
    expect(podeUsarMoldura('lua', { mestre: false })).toBe(true)
  })
  it('a Coroa do Mestre só para quem mestra; a especial só para a lista', () => {
    expect(podeUsarMoldura('mestre', { mestre: false })).toBe(false)
    expect(podeUsarMoldura('mestre', { mestre: true })).toBe(true)
    expect(podeUsarMoldura('leste', { mestre: true, usuario: 'qualquer_um' })).toBe(ESPECIAIS.includes('qualquer_um'))
    expect(podeUsarMoldura('nao-existe', { mestre: true })).toBe(false)
  })
})

describe('estilos de dados (v0.37.1)', () => {
  it('ids únicos, cores válidas e materiais do dice-box', () => {
    expect(new Set(ESTILOS_DADOS.map(e => e.id)).size).toBe(ESTILOS_DADOS.length)
    for (const e of ESTILOS_DADOS) {
      for (const c of [e.fundo, e.numero, e.contorno]) expect(c).toMatch(/^#[0-9a-f]{6}$/)
      expect(['glass', 'metal', 'wood', 'plastic', 'none']).toContain(e.material)
    }
  })
  it('estilo desconhecido cai no padrão; o colorset tem o formato do dice-box', () => {
    expect(estiloDado('xyz').id).toBe(DADO_PADRAO)
    expect(colorsetDe(estiloDado('ouro'))).toEqual({ name: 'prg-ouro', foreground: '#2b1d03', background: '#e0b030', outline: '#7a5a00', texture: 'metal', material: 'metal' })
    expect(colorsetDe(estiloDado('neon')).texture).toBe('none')
  })
  it('toda textura usada tem o arquivo em public/assets/dados3d', async () => {
    const { existsSync } = await import('node:fs')
    const { imagemTextura } = await import('./estilosDados')
    for (const e of ESTILOS_DADOS) if (e.textura) expect(existsSync('public' + imagemTextura(e.textura))).toBe(true)
  })
})

describe('visual guarda moldura e dado (v0.37.1)', () => {
  it('aceita só ids conhecidos', () => {
    expect(limparVisual({ moldura: 'chamas', dado: 'neon' })).toEqual({ moldura: 'chamas', dado: 'neon' })
    expect(limparVisual({ moldura: '<script>', dado: 42 })).toEqual({})
  })
})
