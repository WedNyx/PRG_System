import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ARSENAIS, arsenalDoSistema, danoMaximo, maximoMaisRolagem, multiplicarDano } from './arsenalSistemas'
import { itemDoArsenal } from './arsenal'
import { partesIconeGi } from './iconesGi'
import { normalizarItem } from './sistemas/inventario'
import { rolarExpressao } from './dice'
import { SISTEMAS } from './sistemas/catalogo'
import { OPCOES_EXTRAS } from './sistemas/opcoesExtras'

describe('arsenal de cada sistema (v0.36.6)', () => {
  it('crítico do jeito de cada jogo', () => {
    expect(multiplicarDano('1d8+2', 3)).toBe('3d8+2')
    expect(multiplicarDano('1d8+2', 2, true)).toBe('2d8+4')
    expect(danoMaximo('2d6+1')).toBe(13)
    expect(maximoMaisRolagem('1d8+1')).toBe('9+1d8+1')
  })
  it('todo sistema da lista existe, tem ícones do acervo e itens válidos', () => {
    for (const [id, a] of Object.entries(ARSENAIS)) {
      expect(SISTEMAS.some(s => s.id === id), id).toBe(true)
      expect(arsenalDoSistema(id)).toBe(a)
      expect(a.itens.length, id).toBeGreaterThanOrEqual(6)
      for (const x of a.itens) {
        const p = partesIconeGi(x.icone)
        expect(p, x.icone).not.toBeNull()
        expect(existsSync(join(process.cwd(), 'node_modules/game-icons-transparent/svgs', p!.autor, p!.nome + '.svg')), x.icone).toBe(true)
        const it = itemDoArsenal(x, () => 'abc')
        expect(normalizarItem(it), id + ': ' + x.nome).toEqual(it)
        for (const r of x.rolagens ?? []) expect(rolarExpressao(r.expr), `${id}: ${x.nome} ${r.expr}`).not.toBeNull()
        if (x.dano) expect(rolarExpressao(x.dano), `${id}: ${x.nome} ${x.dano}`).not.toBeNull()
      }
    }
    expect(arsenalDoSistema('nada')).toBeNull()
  })
  it('sistemas comerciais sem texto de livro; sugestões viram campos de escolha', () => {
    for (const id of ['tormenta20', 'call-of-cthulhu', 'mork-borg']) for (const x of ARSENAIS[id].itens) expect(x.descricao.length, x.nome).toBeLessThan(140)
    for (const [id, campos] of Object.entries(OPCOES_EXTRAS)) {
      const s = SISTEMAS.find(x => x.id === id)!
      for (const c of Object.keys(campos)) expect(s.campos.find(f => f.id === c)?.tipo, id + '.' + c).toBe('escolha')
    }
    expect(OPCOES_EXTRAS.tormenta20.divindade).toHaveLength(20)
  })
})
