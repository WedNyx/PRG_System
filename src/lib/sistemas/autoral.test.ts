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
      const r = validarSistema({ ...s, nome: s.nome.slice(0, 80) }, { id: ID })
      expect(r.ok, s.id + ': ' + (!r.ok ? r.erros.join(' | ') : '')).toBe(true)
    }
  })
})

describe('rolagem personalizada (v0.16)', () => {
  const base = { nome: 'Pool', atributos: [{ nome: 'Corpo', min: 0, max: 6, padrao: 2 }] }
  it('aceita fórmula válida e guarda a regra', () => {
    const r = validarSistema({ ...base, rolagem: 'personalizada', regraRolagem: { nome: 'Sucessos', formula: 'VALORd6s5' } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.sistema.rolagem).toBe('personalizada')
    expect(r.sistema.regraRolagem).toEqual({ nome: 'Sucessos', formula: 'VALORd6s5' })
  })
  it('recusa fórmula que não funciona e explica', () => {
    const r = validarSistema({ ...base, rolagem: 'personalizada', regraRolagem: { nome: 'X', formula: '2d6s9+VALOR' } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(!r.ok && r.erros.join()).toMatch(/Rolagem personalizada/)
    const r2 = validarSistema({ ...base, rolagem: 'personalizada', regraRolagem: { nome: 'X', formula: 'alert(1)' } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(!r2.ok && r2.erros.join()).toMatch(/só pode ter/)
  })
  it('todos os modelos prontos funcionam', async () => {
    const { MODELOS_ROLAGEM, erroDaFormula } = await import('./regrasRolagem')
    for (const m of MODELOS_ROLAGEM) expect(erroDaFormula(m.formula), m.id).toBeNull()
  })
})

describe('campos de escolha (classe, espécie)', () => {
  it('valida opções, tira bônus sem alvo e soma o bônus da opção escolhida', async () => {
    const { validarSistema, sistemaEmBranco } = await import('./autoral')
    const { calcular, fichaVazia } = await import('./calculo')
    const base = sistemaEmBranco() as Record<string, unknown> & { campos: Record<string, unknown>[] }
    const def = { ...base, nome: 'Escolhas', campos: [...base.campos, { id: 'origem', nome: 'Origem', tipo: 'escolha', opcoes: [{ nome: 'Nobre', bonus: [{ alvo: 'atributo:NADA', valor: 3 }] }, { nome: 'nobre' }] }] }
    const r = validarSistema(def, { id: ID })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const origem = r.sistema.campos.find(c => c.id === 'origem')!
    expect(origem.opcoes).toEqual([{ nome: 'Nobre' }])
    expect(r.avisos.some(a => /opções/.test(a))).toBe(true)
    const d = fichaVazia(r.sistema)
    const antes = calcular(r.sistema, d)
    const depois = calcular(r.sistema, { ...d, campos: { ...d.campos, classe: 'guerreiro', especie: 'Elfo' } })
    expect(depois.vars.FOR).toBe(Number(antes.vars.FOR) + 1)
    expect(depois.pericias.luta).toBe(Number(antes.pericias.luta) + 3) // +1 do FOR e +2 direto
    expect(depois.derivados.defesa).toBe(Number(antes.derivados.defesa) + 1)
    expect(validarSistema({ ...def, campos: [{ nome: "Classe", tipo: "escolha", opcoes: [] }] }, { id: ID }).ok).toBe(false)
  })
})
