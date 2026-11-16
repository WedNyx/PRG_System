import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ARSENAL, ESTILOS_ARSENAL, itemDoArsenal } from './arsenal'
import { partesIconeGi } from './iconesGi'
import { acoesRapidas, lerRolagensItem, normalizarItem } from './sistemas/inventario'

describe('arsenal pronto (v0.35.3)', () => {
  const todos = Object.values(ARSENAL).flat()
  it('cada estilo tem itens e todo ícone existe no acervo do Game-Icons', () => {
    for (const e of ESTILOS_ARSENAL) expect(ARSENAL[e.id].length).toBeGreaterThanOrEqual(15)
    for (const x of [...todos.map(t => t.icone), ...ESTILOS_ARSENAL.map(e => e.icone)]) {
      const p = partesIconeGi(x)
      expect(p, x).not.toBeNull()
      expect(existsSync(join(process.cwd(), 'node_modules/game-icons-transparent/svgs', p!.autor, p!.nome + '.svg')), x).toBe(true)
    }
  })
  it('vira um item válido, sem perder nada na validação', () => {
    for (const x of todos) {
      const it = itemDoArsenal(x, () => 'abc')
      expect(normalizarItem(it)).toEqual(it)
    }
  })
})

describe('rolagens prontas e ações rápidas (v0.35.3)', () => {
  it('guarda até 6 rolagens válidas', () => {
    expect(lerRolagensItem([{ nome: 'Acerto', expr: '1d20+5' }, { nome: '', expr: '1d6' }, { nome: 'X', expr: 'rm -rf' }, { nome: 'Y', expr: '+' }])).toEqual([{ nome: 'Acerto', expr: '1d20+5' }])
    expect(lerRolagensItem(Array.from({ length: 9 }, (_, i) => ({ nome: 'R' + i, expr: '1d6' })))).toHaveLength(6)
  })
  it('mostra itens equipados com dados e poderes com rolagem', () => {
    const d = {
      itens: [{ id: 'a', nome: 'Espada', categoria: 'arma', dano: '1d8', rolagens: [{ nome: 'Acerto', expr: '1d20+5' }] },
        { id: 'b', nome: 'Arco', categoria: 'arma', dano: '1d8' }, { id: 'c', nome: 'Escudo', categoria: 'armadura' }],
      poderes: [{ id: 'p', nome: 'Bola de fogo', tipo: 'magia', expressao: '8d6' }, { id: 'q', nome: 'Voo', tipo: 'magia' }],
      uso: { itens: { a: { qtd: 1, equipado: true }, b: { qtd: 1, equipado: false }, c: { qtd: 1, equipado: true } } },
    }
    const r = acoesRapidas(d)
    expect(r.map(x => x.nome)).toEqual(['Espada', 'Bola de fogo'])
    expect(r[0].rolagens).toEqual([{ nome: 'Dano', expr: '1d8' }, { nome: 'Acerto', expr: '1d20+5' }])
  })
})
