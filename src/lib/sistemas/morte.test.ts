import { describe, expect, it } from 'vitest'
import { aceitarMedida, aoCair, aoLevantar, danoCaido, lerMorte, testeMorte } from './morte'

const vazio = lerMorte(null)
describe('à beira da morte', () => {
  it('cai e conta as falhas futuras', () => {
    expect(aoCair(vazio)).toEqual({ estado: 'caido', sucessos: 0, falhas: 0, futuras: 0 })
    expect(aoCair({ ...vazio, futuras: 3 }).estado).toBe('morto')
    expect(aoCair({ ...vazio, futuras: 1 }).falhas).toBe(1)
  })
  it('testes: sucesso, falha, 1 e 20', () => {
    let m = aoCair(vazio)
    m = testeMorte(m, 14).m; m = testeMorte(m, 3).m; expect([m.sucessos, m.falhas]).toEqual([1, 1])
    m = testeMorte(m, 1).m; expect(m.estado).toBe('morto')
    const r = testeMorte(aoCair(vazio), 20); expect(r.levanta).toBe(true); expect(r.m.estado).toBeUndefined()
    let e = aoCair(vazio); for (const d of [10, 12, 19]) e = testeMorte(e, d).m; expect(e.estado).toBe('estavel')
  })
  it('dano em quem está caído é falha; estável volta a cair', () => {
    expect(danoCaido(aoCair(vazio), true).falhas).toBe(2)
    const est = { estado: 'estavel' as const, sucessos: 3, falhas: 1, futuras: 0 }
    expect(danoCaido(est)).toEqual({ estado: 'caido', sucessos: 0, falhas: 2, futuras: 0 })
  })
  it('medidas desesperadas', () => {
    expect(aceitarMedida(vazio, 1)?.futuras).toBe(1)
    expect(aceitarMedida({ ...vazio, futuras: 1 }, 3)).toBeNull()
    expect(aceitarMedida(aoCair(vazio), 1)).toBeNull()
    expect(aoLevantar({ estado: 'caido', sucessos: 2, falhas: 2, futuras: 1 })).toEqual({ sucessos: 0, falhas: 0, futuras: 1 })
  })
})
