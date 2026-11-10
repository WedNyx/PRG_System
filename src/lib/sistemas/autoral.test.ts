import { describe, expect, it } from 'vitest'
import { ehAutoral, idAutoral, sistemaEmBranco, slug, uuidDoAutoral, validarSistema } from './autoral'
import { calcular, fichaVazia } from './calculo'
import { SISTEMAS } from './catalogo'

const ID = idAutoral('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d')
describe('sistemas autorais', () => {
  it('ids', () => {
    expect(ehAutoral(ID)).toBe(true); expect(ID.length).toBeLessThanOrEqual(40)
    expect(uuidDoAutoral(ID)).toBe('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d')
    expect(ehAutoral('dnd5e-srd')).toBe(false)
    expect(slug('Pontos de Mana')).toBe('pontos_de_mana'); expect(slug('Força', true)).toBe('FORCA'); expect(slug('3 vidas')).toBe('v3_vidas')
  })
  it('o modelo em branco é válido e calcula', () => {
    const r = validarSistema({ ...sistemaEmBranco(), nome: 'Meu Sistema' }, { id: ID, autor: 'Wed' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.sistema.tipo).toBe('autoral'); expect(r.sistema.licenca).toContain('Wed')
    const c = calcular(r.sistema, fichaVazia(r.sistema))
    expect(c.derivados.vida_max).toBe(10 + 2 + 3); expect(c.recursosMax.vida).toBe(15); expect(c.pericias.luta).toBe(1)
  })
  it('acusa variável que não existe e fórmula quebrada', () => {
    const base = { ...sistemaEmBranco(), nome: 'X1' }
    let r = validarSistema({ ...base, derivados: [{ nome: 'Defesa', formula: '10 + DESTREZA' }] }, { id: ID })
    expect(r.ok).toBe(false); if (!r.ok) expect(r.erros[0]).toContain('DESTREZA')
    r = validarSistema({ ...base, derivados: [{ nome: 'Defesa', formula: '10 + (AGI' }] }, { id: ID })
    expect(r.ok).toBe(false)
    r = validarSistema({ ...base, formulaModificador: 'piso((X - 10) / 2)' }, { id: ID })
    expect(r.ok).toBe(true)
  })
  it('limpa ids ruins, repetidos e reservados; recusa sistema vazio ou sem nome', () => {
    const r = validarSistema({ nome: 'Ids', atributos: [{ id: 'FOR', nome: 'Força' }, { id: 'FOR', nome: 'Fé' }, { id: 'mod_X', nome: 'Mod' }], campos: [{ id: '<script>', nome: 'Classe' }] }, { id: ID })
    expect(r.ok).toBe(true); if (!r.ok) return
    const ids = r.sistema.atributos.map(a => a.id)
    expect(new Set(ids).size).toBe(3); expect(ids.some(i => i.startsWith('mod_'))).toBe(false); expect(r.sistema.campos[0].id).toBe('classe')
    expect(validarSistema({ nome: 'Vazio' }, { id: ID }).ok).toBe(false)
    expect(validarSistema({ ...sistemaEmBranco(), nome: '' }, { id: ID }).ok).toBe(false)
  })
  it('todos os sistemas do catálogo podem servir de modelo inicial', () => {
    for (const s of SISTEMAS) {
      if (s.progressoes) continue // tabelas por classe ainda não são editáveis no construtor
      const r = validarSistema({ ...s, nome: s.nome.slice(0, 80) }, { id: ID })
      expect(r.ok, s.id + ': ' + (!r.ok ? r.erros.join(' | ') : '')).toBe(true)
    }
  })
})
