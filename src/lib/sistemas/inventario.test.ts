import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { calcular, fichaVazia } from './calculo'
import { normalizarItem as normalizarItemT } from './inventario'
import { bonusEquipados, lerItens, lerPoderes, lerUso, pesoTotal, podeUsar, transferirItem, type ComItens } from './inventario'

describe('inventário', () => {
  it('normaliza e recusa dados ruins', () => {
    const itens = lerItens([{ id: 'a', nome: 'Espada', categoria: 'arma', peso: 1.5, dano: '1d8+2', bonus: [{ alvo: 'derivado:ca', valor: 1 }, { alvo: '<script>', valor: 9 }] }, { nome: '' }, 'lixo'])
    expect(itens).toHaveLength(1)
    expect(itens[0]).toMatchObject({ id: 'a', categoria: 'arma', dano: '1d8+2', bonus: [{ alvo: 'derivado:ca', valor: 1 }] })
    expect(lerItens([{ id: 'b', nome: 'X', dano: 'alert(1)' }])[0].dano).toBeUndefined()
    expect(lerPoderes([{ id: 'p', nome: 'Bola de fogo', tipo: 'magia', recurso: 'pm', custo: 3, expressao: '8d6' }])[0]).toMatchObject({ recurso: 'pm', custo: 3, expressao: '8d6' })
  })
  it('só itens equipados dão bônus; peso conta a quantidade', () => {
    const itens = lerItens([{ id: 'e', nome: 'Escudo', categoria: 'armadura', peso: 3, bonus: [{ alvo: 'derivado:ca', valor: 2 }] }, { id: 'c', nome: 'Corda', peso: 0.5, bonus: [] }])
    const uso = lerUso({ itens: { e: { qtd: 1, equipado: false }, c: { qtd: 4 } } })
    expect(bonusEquipados(itens, uso)).toEqual({})
    uso.itens.e.equipado = true
    expect(bonusEquipados(itens, uso)).toEqual({ 'derivado:ca': 2 })
    expect(pesoTotal(itens, uso)).toBe(5)
  })
  it('poder com usos e custo', () => {
    const p = lerPoderes([{ id: 'p', nome: 'Cura', recurso: 'pm', custo: 2, usosMax: 2 }])[0]
    expect(podeUsar(p, lerUso({}), 5).ok).toBe(true)
    expect(podeUsar(p, lerUso({}), 1).ok).toBe(false)
    expect(podeUsar(p, lerUso({ poderes: { p: 2 } }), 5).ok).toBe(false)
  })
})

describe('itens equipados na ficha', () => {
  it('D&D: escudo soma CA, anel soma salvaguarda, carga pela Força', () => {
    const s = sistemaPorId('dnd5e-srd')!, d = fichaVazia(s)
    d.atributos.FOR = 14; d.atributos.DES = 12
    d.itens = [{ id: 'e', nome: 'Escudo', categoria: 'armadura', peso: 3, bonus: [{ alvo: 'derivado:ca', valor: 2 }] },
      { id: 'a', nome: 'Anel de proteção', categoria: 'tesouro', peso: 0, bonus: [{ alvo: 'pericia:resist_sabedoria', valor: 1 }, { alvo: 'atributo:FOR', valor: 2 }] }]
    d.uso = { itens: { e: { qtd: 1, equipado: true }, a: { qtd: 1, equipado: true } } }
    const c = calcular(s, d)
    expect(c.derivados.ca).toBe(10 + 1 + 2)
    expect(c.pericias.resist_sabedoria).toBe(0 + 1)
    expect(c.mods.FOR).toBe(3) // 14 + 2 = 16
    expect(c.carga).toEqual({ total: 3, max: 16 * 7.5, unidade: 'kg' })
  })
  it('Lunethernnyis: bônus de item não estoura os pontos de criação', () => {
    const s = sistemaPorId('lunethernnyis')!, d = fichaVazia(s)
    d.itens = [{ id: 'm', nome: 'Manopla', bonus: [{ alvo: 'atributo:POT', valor: 3 }] }]; d.uso = { itens: { m: { qtd: 1, equipado: true } } }
    const c = calcular(s, d)
    expect(c.vars.POT).toBe(4); expect(c.limites.every(l => !l.excedido)).toBe(true)
  })
})

describe('passar item entre personagens', () => {
  const arco = { id: 'arco', nome: 'Arco', categoria: 'arma', peso: 1, dano: '1d8', bonus: [] }
  const pocao = { id: 'p1', nome: 'Poção de cura', categoria: 'consumivel', peso: 0.5, bonus: [] }
  const lyra: ComItens = { itens: [arco, pocao], uso: { itens: { arco: { qtd: 1, equipado: true }, p1: { qtd: 3, equipado: false } }, poderes: {}, carteira: '' } }
  const borin: ComItens = { itens: [{ ...pocao, id: 'outra' }], uso: { itens: { outra: { qtd: 2, equipado: false } }, poderes: {}, carteira: '' } }
  it('passa parte de uma pilha e empilha em quem recebe', () => {
    const r = transferirItem(lyra, borin, 'p1', 2)
    if (!r.ok) throw new Error(r.erro)
    expect((r.de.uso as { itens: Record<string, { qtd: number }> }).itens.p1.qtd).toBe(1)
    expect((r.para.uso as { itens: Record<string, { qtd: number }> }).itens.outra.qtd).toBe(4)
    expect(r.para.itens).toHaveLength(1)
  })
  it('passar tudo tira o item e quem recebe ganha desequipado', () => {
    const r = transferirItem(lyra, borin, 'arco', 1)
    if (!r.ok) throw new Error(r.erro)
    expect(r.de.itens!.map(i => (i as { id: string }).id)).toEqual(['p1'])
    expect(r.para.itens).toHaveLength(2)
    expect((r.para.uso as { itens: Record<string, { qtd: number; equipado: boolean }> }).itens.arco).toEqual({ qtd: 1, equipado: false })
  })
  it('recusa quantidade inválida ou item que não existe', () => {
    expect(transferirItem(lyra, borin, 'p1', 4).ok).toBe(false)
    expect(transferirItem(lyra, borin, 'p1', 0).ok).toBe(false)
    expect(transferirItem(lyra, borin, 'nada', 1).ok).toBe(false)
  })
  it('id repetido em quem recebe ganha id novo', () => {
    const r = transferirItem(lyra, { itens: [{ ...arco, nome: 'Arco longo' }], uso: {} } as ComItens, 'arco', 1)
    if (!r.ok) throw new Error(r.erro)
    const ids = r.para.itens!.map(i => (i as { id: string }).id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('foto e itens mágicos (v0.32.5)', () => {
  it('guarda a foto só se veio da plataforma, e o “mágico”', () => {
    const ok = normalizarItemT({ nome: 'Anel', categoria: 'tesouro', peso: 0, bonus: [], imagem: 'https://abc.supabase.co/storage/v1/object/public/prg-mesa/imagens/a.webp', magico: true })!
    expect(ok.imagem).toContain('prg-mesa'); expect(ok.magico).toBe(true)
    const fora = normalizarItemT({ nome: 'Anel', categoria: 'tesouro', peso: 0, bonus: [], imagem: 'https://site-estranho.com/a.png', magico: 'sim' })!
    expect(fora.imagem).toBeUndefined(); expect(fora.magico).toBeUndefined()
  })
})
