import { describe, expect, it } from 'vitest'
import { ICONES_RPG, iconeRpgPorId, sugestaoIconeRpg } from './iconesRpg'
import { lerItens, normalizarItem, transferirItem } from './sistemas/inventario'
import { sistemaPorId, SISTEMAS } from './sistemas/catalogo'
import { normalizarFicha } from './sistemas/calculo'

describe('Biblioteca visual RPG Game-Icons · PR #48', () => {
  it('contém 32 SVGs originais identificados e sem o fundo preto', () => {
    expect(ICONES_RPG).toHaveLength(32)
    expect(new Set(ICONES_RPG.map(x => x.id)).size).toBe(ICONES_RPG.length)
    for (const ic of ICONES_RPG) {
      expect(ic.nome.length).toBeGreaterThan(2)
      expect(['Lorc', 'Delapouite']).toContain(ic.autor)
      expect(ic.origem).toMatch(/^(lorc|delapouite)\/[a-z-]+\.svg$/)
      expect(ic.paths.length).toBeGreaterThan(0)
      expect(ic.paths.every(p => p.startsWith('M'))).toBe(true)
      expect(ic.paths.join('')).not.toContain('<script')
    }
    expect(iconeRpgPorId('pocao')?.nome).toBe('Poção')
    expect(iconeRpgPorId('desconhecido')).toBeNull()
  })
  it('sugere silhuetas coerentes para formas da Forja e relíquias', () => {
    for (const forma of ['espada', 'adaga', 'arco', 'besta', 'rifle', 'pistola', 'machado', 'tridente', 'livro', 'gema']) {
      expect(sugestaoIconeRpg(forma)).not.toBeNull()
    }
    expect(sugestaoIconeRpg('adaga')).toBe('lamina')
    expect(sugestaoIconeRpg('gema')).toBe('gema')
    expect(sugestaoIconeRpg('anel')).toBe('anel')
    expect(sugestaoIconeRpg('escudo')).toBe('escudo')
    expect(sugestaoIconeRpg('bolsa')).toBe('mochila')
    expect(sugestaoIconeRpg('cajado')).toBe('varinha')
    expect(sugestaoIconeRpg('forma-inexistente')).toBeNull()
  })
  it('salva a imagem e o ícone sem perder nenhum, inclusive após normalização da ficha', () => {
    const imagem = 'https://abc.supabase.co/storage/v1/object/public/prg-mesa/imagens/arma.png'
    const it = normalizarItem({
      id: 'item-rpg', nome: 'Adaga de gelo', categoria: 'arma', peso: 0.5, bonus: [],
      iconeBiblioteca: 'lamina', imagem, raridade: 'raro',
    })!
    expect(it.iconeBiblioteca).toBe('lamina')
    expect(it.imagem).toBe(imagem)
    const s = sistemaPorId('dnd5e-srd')!
    const dado = normalizarFicha(s, { itens: [it] })
    expect(lerItens(dado.itens)[0]).toMatchObject({ imagem, iconeBiblioteca: 'lamina' })
    expect(normalizarItem({ nome: 'A', iconeBiblioteca: '../malicioso.svg' })?.iconeBiblioteca).toBeUndefined()
  })
  it('mantém ícone e foto em TODOS os sistemas, inclusive fichas antigas e sistemas ocultos', () => {
    const imagem = 'https://abc.supabase.co/storage/v1/object/public/prg-mesa/imagens/item.webp'
    expect(SISTEMAS.length).toBeGreaterThan(3)
    for (const sistema of SISTEMAS) {
      const item = normalizarItem({ nome: 'Amuleto do aventureiro', categoria: 'tesouro', peso: 0.1,
        iconeBiblioteca: 'amuleto', imagem, bonus: [] })!
      const normalizada = normalizarFicha(sistema, { itens: [item] })
      expect(lerItens(normalizada.itens)[0], sistema.id).toMatchObject({
        nome: 'Amuleto do aventureiro', iconeBiblioteca: 'amuleto', imagem,
      })
      const antiga = normalizarFicha(sistema, { itens: [{ nome: 'Item antigo', categoria: 'equipamento', peso: 1, bonus: [] }] })
      expect(lerItens(antiga.itens)[0].iconeBiblioteca).toBeUndefined()
    }
  })
  it('preserva desenho de biblioteca e foto durante transferência', () => {
    const item = normalizarItem({ id: 'espada-a', nome: 'Espada', categoria: 'arma', peso: 1,
      iconeBiblioteca: 'espada', imagem: 'https://abc.supabase.co/storage/v1/object/public/prg-mesa/imagens/a.webp' })!
    const movido = transferirItem({ itens: [item], uso: { itens: { 'espada-a': { qtd: 1, equipado: true } } } },
      { itens: [], uso: {} }, 'espada-a', 1)
    if (!movido.ok) throw new Error(movido.erro)
    expect(lerItens(movido.para.itens)[0].iconeBiblioteca).toBe('espada')
    expect(lerItens(movido.para.itens)[0].imagem).toBe(item.imagem)
  })
})
