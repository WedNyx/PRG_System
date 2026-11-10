import { describe, expect, it } from 'vitest'
import { jsonDoSistema, lerJsonSistema, lerTextoSistema, MODELO_TEXTO, textoDoSistema } from './texto'
import { validarSistema } from './autoral'
import { calcular, fichaVazia } from './calculo'
import { SISTEMAS } from './catalogo'

const ID = 'autoral-0123456789abcdef0123456789abcdef'
describe('importar sistema por texto', () => {
  it('o modelo para baixar importa sem avisos e é válido', () => {
    const r = lerTextoSistema(MODELO_TEXTO)
    expect(r.avisos).toEqual([])
    const v = validarSistema(r.definicao, { id: ID })
    expect(v.ok, !v.ok ? v.erros.join(' | ') : '').toBe(true)
    if (!v.ok) return
    expect(v.sistema.nome).toBe('Crônicas da Névoa')
    expect(v.sistema.atributos.map(a => a.id)).toEqual(['FOR', 'AGI', 'MEN'])
    expect(v.sistema.pericias?.lista.find(p => p.nome === 'Furtividade')).toMatchObject({ atributo: 'AGI', grupo: 'Exploração' })
    expect(v.sistema.recursos.find(r => r.nome === 'Sorte')?.maxFixo).toBe(3)
    const c = calcular(v.sistema, fichaVazia(v.sistema))
    expect(c.derivados.vida_max).toBe(10 + 2 + 3); expect(c.recursosMax.vida).toBe(15); expect(c.carga.max).toBe(5)
  })
  it('linhas que não entende viram avisos com o número da linha', () => {
    const r = lerTextoSistema('SISTEMA: X\n[ATRIBUTOS]\nFOR Força 0-5\n[COISAS]\n[LIMITES]\nsem sentido\n')
    expect(r.avisos.some(a => a.startsWith('Linha 4'))).toBe(true)
    expect(r.avisos.some(a => a.startsWith('Linha 6'))).toBe(true)
  })
  it('ida e volta: todos os sistemas da plataforma viram texto e voltam iguais', () => {
    for (const s of SISTEMAS) {
      if (s.progressoes) continue
      const r = lerTextoSistema(textoDoSistema(s))
      expect(r.avisos, s.id).toEqual([])
      const v = validarSistema(r.definicao, { id: ID })
      expect(v.ok, s.id + (!v.ok ? ': ' + v.erros.join(' | ') : '')).toBe(true)
      if (!v.ok) continue
      expect(v.sistema.derivados.map(d => d.id), s.id).toEqual(s.derivados.map(d => d.id))
      expect(v.sistema.pericias?.lista.map(p => p.id), s.id).toEqual(s.pericias?.lista.map(p => p.id))
      const a = calcular(s, fichaVazia(s)), b = calcular(v.sistema, fichaVazia(v.sistema))
      expect(b.derivados, s.id).toEqual(a.derivados); expect(b.pericias, s.id).toEqual(a.pericias); expect(b.recursosMax, s.id).toEqual(a.recursosMax)
    }
  })
  it('json exportado volta (sem id, tipo e autor)', () => {
    const s = SISTEMAS.find(x => x.id === 'fate-core')!
    const r = lerJsonSistema(jsonDoSistema({ ...s, autor: 'Wed' }))
    expect(r.avisos).toEqual([]); expect(r.definicao.id).toBeUndefined(); expect(r.definicao.autor).toBeUndefined()
    expect(validarSistema(r.definicao, { id: ID }).ok).toBe(true)
    expect(lerJsonSistema('{quebrado').avisos.length).toBe(1)
  })
})
