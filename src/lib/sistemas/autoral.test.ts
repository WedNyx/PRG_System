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

describe('rolagem em parada copiada de um sistema da plataforma (v0.33.0)', () => {
  const base = { nome: 'Cópia', atributos: [{ nome: 'Corpo', min: 0, max: 5, padrao: 1 }] }
  it('preserva o modo de rolagem e os lados do dado ao copiar a estrutura de Ordem Paranormal/Blades', () => {
    const r = validarSistema({ ...base, rolagem: 'parada', parada: { lados: 20 } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.sistema.rolagem).toBe('parada'); expect(r.sistema.parada).toEqual({ lados: 20 }); expect(r.sistema.dados).toBe('Parada de d20')
  })
  it('limita os lados do dado a uma faixa razoável', () => {
    const r = validarSistema({ ...base, rolagem: 'parada', parada: { lados: 99999 } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(r.ok && r.sistema.parada).toEqual({ lados: 100 })
    const r2 = validarSistema({ ...base, rolagem: 'parada', parada: { lados: 0 } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(r2.ok && r2.sistema.parada).toEqual({ lados: 2 })
  })
  it('preserva a leitura Blades e as resistências ao copiar a estrutura de Blades', () => {
    const comResistencia = { ...base, derivados: [{ nome: 'Perspicácia', formula: '2' }], rolagem: 'parada', parada: { lados: 6, leitura: 'blades' }, resistencias: ['perspicacia'] }
    const r = validarSistema(comResistencia, { id: 'autoral-' + '0'.repeat(32) })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.sistema.parada).toEqual({ lados: 6, leitura: 'blades' }); expect(r.sistema.resistencias).toEqual(['perspicacia'])
  })
  it('ignora leitura desconhecida e resistências que não apontam para um derivado do sistema', () => {
    const r = validarSistema({ ...base, rolagem: 'parada', parada: { lados: 6, leitura: 'outra-coisa' }, resistencias: ['nao_existe'] }, { id: 'autoral-' + '0'.repeat(32) })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.sistema.parada).toEqual({ lados: 6 }); expect(r.sistema.resistencias).toBeUndefined()
  })
})

describe('valor inicial de perícia copiado de um sistema da plataforma (v0.33.0)', () => {
  const base = { nome: 'Cópia BRP', atributos: [{ nome: 'Destreza', id: 'DES', min: 1, max: 30, padrao: 10 }] }
  it('preserva o valor-base das perícias (ex.: BRP) para fichas novas já nascerem com ele', () => {
    const r = validarSistema({ ...base, pericias: { modo: 'valor', lista: [{ nome: 'Escalar', base: '40' }, { nome: 'Esquivar', base: 'DES * 2' }] } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const ids = Object.fromEntries(r.sistema.pericias!.lista.map(p => [p.nome, p.id]))
    const d = fichaVazia(r.sistema)
    expect(d.pericias[ids.Escalar]).toBe(40); expect(d.pericias[ids.Esquivar]).toBe(20)
  })
  it('recusa fórmula de valor-base com variável que não é atributo', () => {
    const r = validarSistema({ ...base, pericias: { modo: 'valor', lista: [{ nome: 'Escalar', base: 'nivel' }] } }, { id: 'autoral-' + '0'.repeat(32) })
    expect(!r.ok && r.erros.join()).toMatch(/Valor inicial/)
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

describe('classe escolhida define a tabela de níveis', () => {
  const soma = (g: number[]) => { let t = 0; return g.map(x => (t += x)) }
  const tab = (vida: number) => ({ vida: soma(Array(20).fill(vida)), arvore: soma(Array(20).fill(1)) })
  const def = {
    nome: 'Classes', dados: 'd20', rolagem: 'd20',
    campos: [{ id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 }, { id: 'nivel2', nome: 'Nível 2', tipo: 'numero', padrao: 0 },
      { id: 'classe', nome: 'Classe', tipo: 'escolha', opcoes: [{ nome: 'Guerreiro', progressao: 'guerreiro' }, { nome: 'Mago', progressao: 'mago' }, { nome: 'Fantasma', progressao: 'nao_existe' }] },
      { id: 'classe2', nome: 'Segunda classe', tipo: 'escolha', nivel: 'nivel2', opcoes: [{ nome: 'Guerreiro', progressao: 'guerreiro' }, { nome: 'Mago', progressao: 'mago' }] }],
    atributos: [{ id: 'FOR', nome: 'Força', min: 0, max: 5, padrao: 1 }],
    derivados: [{ id: 'vida_max', nome: 'Vida máxima', formula: '5 + prog_vida' }], recursos: [{ id: 'vida', nome: 'Vida', formula: 'vida_max' }],
    progressoes: { classes: [
      { id: 'guerreiro', nome: 'Guerreiro', campoNivel: 'nivel', tabela: tab(10) },
      { id: 'mago', nome: 'Mago', campoNivel: 'nivel', tabela: tab(4) }] },
  }
  it('só a tabela da classe escolhida vale, no nível do campo da escolha', async () => {
    const { progressaoAtiva, escolhasDeClassePendentes } = await import('./calculo')
    const r = validarSistema(def, { id: ID })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.avisos.some(a => /tabela de níveis/.test(a))).toBe(true)
    expect(r.sistema.campos.find(c => c.id === 'classe')!.opcoes!.find(o => o.nome === 'Fantasma')!.progressao).toBeUndefined()
    const d = fichaVazia(r.sistema)
    expect(calcular(r.sistema, { ...d, campos: { ...d.campos, nivel: 3 } }).derivados.vida_max).toBe(5)
    expect(escolhasDeClassePendentes(r.sistema, d).map(c => c.id)).toEqual(['classe', 'classe2'])
    const g = { ...d, campos: { ...d.campos, nivel: 3, classe: 'Guerreiro' } }
    expect(calcular(r.sistema, g).derivados.vida_max).toBe(35)
    expect(calcular(r.sistema, { ...g, campos: { ...g.campos, classe: 'Mago' } }).derivados.vida_max).toBe(17)
    // multiclasse: Guerreiro 3 + Mago 2 (campo Nível 2)
    const m = { ...g, campos: { ...g.campos, classe2: 'Mago', nivel2: 2 } }
    expect(calcular(r.sistema, m).derivados.vida_max).toBe(5 + 30 + 8)
    expect(calcular(r.sistema, m).vars.nivel_total).toBe(5)
    expect(progressaoAtiva(r.sistema, m).map(x => x.nome + '@' + x.campoNivel)).toEqual(['Guerreiro@nivel', 'Mago@nivel2'])
  })
})

describe('nomes próprios das partes (v0.33.8)', () => {
  it('guarda como o sistema chama atributos e perícias', () => {
    const base = sistemaEmBranco()
    const r = validarSistema({ ...base, nome: 'Contos', tituloAtributos: '  Aspectos ', pericias: { modo: 'treino', titulo: 'Ofícios', total: 'MOD + TREINO', treinos: [{ nome: 'Treinado', formula: '2' }], lista: [{ nome: 'Ferraria' }] } }, { id: 'autoral-00000000000000000000000000000001' })
    expect(r.ok).toBe(true)
    if (r.ok) { expect(r.sistema.tituloAtributos).toBe('Aspectos'); expect(r.sistema.pericias?.titulo).toBe('Ofícios') }
  })
})
