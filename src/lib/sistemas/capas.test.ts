import { describe, expect, it } from 'vitest'
import { capaDoSistema, matizDoNome } from './capas'
import { SISTEMAS_VISIVEIS } from './catalogo'
import { existsSync } from 'node:fs'

describe('capas dos sistemas', () => {
  it('todo sistema da plataforma tem capa própria e o arquivo existe', () => {
    for (const s of SISTEMAS_VISIVEIS.filter(x => x.tipo !== 'autoral')) {
      const c = capaDoSistema(s.id, s.nome)
      expect(c.src).toBe(`/capas/sistemas/${s.id}.svg`)
      expect(existsSync('public' + c.src)).toBe(true)
    }
  })
  it('autoral usa a capa enviada ou a genérica com cor do nome', () => {
    expect(capaDoSistema('autoral-x', 'A', 'https://x/storage/v1/object/public/prg-mesa/a.webp').src).toContain('prg-mesa')
    const g = capaDoSistema('autoral-x', 'Crônicas da Névoa')
    expect(g.src).toBe('/capas/sistemas/autoral.svg')
    expect(g.matiz).toBe(matizDoNome('Crônicas da Névoa'))
    expect(matizDoNome('a')).not.toBe(matizDoNome('b'))
  })
})
