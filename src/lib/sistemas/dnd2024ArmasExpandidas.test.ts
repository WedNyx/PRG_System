import { describe, expect, it } from 'vitest'
import { ARMAS_DND_EXPANDIDAS, LIVROS_ARMAS_DND, referenciaArmaDndPorId, totalArmasDndCatalogo } from './dnd2024ArmasExpandidas'
import { ARMAS_DND_2024, expressaoDanoLivreDnd, armaDndPorId } from './dnd2024Armas'
import { lerItens, normalizarItem, transferirItem } from './inventario'
import { arteDoItem, FORMAS } from '../itensArte'
import { normalizarFicha } from './calculo'
import { sistemaPorId } from './catalogo'

describe('Arsenal D&D 2024 expandido — PR #48', () => {
  it('reúne as 38 armas do SRD e o índice completo pesquisado de livros e suplementos', () => {
    expect(ARMAS_DND_2024).toHaveLength(38)
    expect(ARMAS_DND_EXPANDIDAS).toHaveLength(196)
    expect(totalArmasDndCatalogo(38)).toBe(234)
    expect(new Set(ARMAS_DND_EXPANDIDAS.map(a => a.id)).size).toBe(ARMAS_DND_EXPANDIDAS.length)
    expect(LIVROS_ARMAS_DND.length).toBeGreaterThan(25)
    for (const a of ARMAS_DND_EXPANDIDAS) {
      expect(a.nome.length).toBeGreaterThan(1)
      expect(a.livro.length).toBeGreaterThan(5)
      expect(referenciaArmaDndPorId(a.id)).toMatchObject({ nome: a.nome, livro: a.livro })
    }
  })
  it('oferece as 8 armas tecnológicas com dados conhecidos, e 3 regionais', () => {
    const moderna = ARMAS_DND_EXPANDIDAS.filter(a => a.classe === 'moderna')
    const futura = ARMAS_DND_EXPANDIDAS.filter(a => a.classe === 'futurista')
    const cenario = ARMAS_DND_EXPANDIDAS.filter(a => a.classe === 'cenario')
    expect(moderna).toHaveLength(5)
    expect(futura).toHaveLength(3)
    expect(cenario).toHaveLength(3)
    expect(futura.find(a => a.nome === 'Rifle de antimatéria')).toMatchObject({ dano: '6d8', tipoDano: 'Necrótico' })
    expect(cenario.find(a => a.nome === 'Yklwa')?.dano).toBe('1d8')
    expect(cenario.find(a => a.nome === 'Hoopak')?.dano).toBeUndefined()
  })
  it('inclui os itens pesquisados em livros de 2014–2026 com fonte e sem criar dano mágico fictício', () => {
    const nomes = ARMAS_DND_EXPANDIDAS.map(a => a.nome)
    for (const nome of ['Flame Tongue', 'Vorpal Sword', 'Sun Blade', 'Moon Sickle', 'Oathbow',
      'Double-Bladed Scimitar', 'Ashbringer', 'Frostmourne', 'Ebonbane', 'Life-Sapping Blade', 'Trick Weapon']) {
      expect(nomes).toContain(nome)
    }
    const flame = ARMAS_DND_EXPANDIDAS.find(a => a.nome === 'Flame Tongue')!
    expect(flame.dano).toBeUndefined()
    expect(flame.livro).toMatch(/Dungeon Master's|Dungeon Master’s/)
    expect(ARMAS_DND_EXPANDIDAS.find(a => a.nome === 'Doomhammer')?.armaBase).toBe('martelo-guerra')
    expect(armaDndPorId('martelo-guerra')).not.toBeNull()
  })
  it('preserva a referência de livro após normalização, transferência e atualização da ficha', () => {
    const ref = ARMAS_DND_EXPANDIDAS.find(x => x.nome === 'Frostmourne')!
    const it = normalizarItem({ id: 'rpgitem1', nome: ref.nome, categoria: 'arma',
      armaRefDnd: ref.id, peso: 0, bonus: [], magico: true })!
    expect(it).toMatchObject({ armaRefDnd: ref.id, magico: true })
    expect(lerItens([it])[0].armaRefDnd).toBe(ref.id)
    const s = sistemaPorId('dnd5e-srd')!
    const d = normalizarFicha(s, { itens: [it] })
    expect(lerItens(d.itens)[0].armaRefDnd).toBe(ref.id)
    const transferida = transferirItem({ itens: [it], uso: { itens: { rpgitem1: { qtd: 1, equipado: true } } } },
      { itens: [], uso: {} }, 'rpgitem1', 1)
    if (!transferida.ok) throw new Error(transferida.erro)
    expect((transferida.para.itens?.[0] as typeof it).armaRefDnd).toBe(ref.id)
    expect(normalizarItem({ nome: 'Incorreto', categoria: 'arma', armaRefDnd: 'ref-inexistente' })?.armaRefDnd).toBeUndefined()
  })
  it('faz crítico avulso multiplicando SOMENTE os dados, mantendo modificadores', () => {
    expect(expressaoDanoLivreDnd('1d8+2d6+3', true)).toBe('2d8+4d6+3')
    expect(expressaoDanoLivreDnd('2d8-1', true, 4)).toBe('4d8-1+4')
    expect(expressaoDanoLivreDnd('2d10', false, 3)).toBe('2d10+3')
    expect(expressaoDanoLivreDnd('1', true, 4)).toBe('1+4')
    expect(expressaoDanoLivreDnd('texto')).toBeNull()
    expect(expressaoDanoLivreDnd('1d8!')).toBeNull()
  })
  it('a nova forja tem artes de armas variadas com relíquias visualmente distintas e determinísticas', () => {
    for (const forma of ['besta', 'rifle', 'pistola', 'chicote', 'tridente', 'mangual', 'alabarda', 'cimitarra', 'foice-arma', 'lamina-radiante']) {
      expect(FORMAS.some(f => f.id === forma)).toBe(true)
    }
    expect(arteDoItem({ nome: 'Rifle laser', categoria: 'arma' }).forma).toBe('rifle')
    expect(arteDoItem({ nome: 'Sun Blade', categoria: 'arma' }).forma).toBe('lamina-radiante')
    expect(arteDoItem({ nome: 'Besta pesada', categoria: 'arma' }).forma).toBe('besta')
    const a = arteDoItem({ nome: 'Frostmourne', categoria: 'arma', magico: true })
    const b = arteDoItem({ nome: 'Frostmourne', categoria: 'arma', magico: true })
    expect(a).toEqual(b)
  })
})
