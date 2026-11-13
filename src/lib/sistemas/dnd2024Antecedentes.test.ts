import { describe, expect, it } from 'vitest'
import { fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'
import {
  aplicarAntecedenteDnd, lerRegistroAntecedenteDnd, validarAlteracoesAntecedenteDnd,
  validarDistribuicaoAntecedenteDnd,
} from './dnd2024Antecedentes'
import {
  FONTE_LEGADO_2014, fontesLiberadas, validarFontesCamposDnd,
} from './dnd2024Fontes'
import { efeitosDnd2024 } from './dnd2024Efeitos'
import { etapasCriacaoDnd2024 } from './guiaCriacaoDnd2024'

const nova = (antecedente: string) => {
  const d = fichaVazia(sistemaPorId('dnd5e-srd')!)
  d.campos = { ...d.campos, classe: 'Guerreiro', nivel: 1, antecedente }
  return d
}
const kit = { equipamento: 'pacote' as const, ferramentaEscolhida: 'Xadrez' }

describe('D&D 2024: distribuição guiada e Forasteiro 2014', () => {
  it('SRD: só os três atributos do antecedente podem receber +2/+1 ou +1/+1/+1', () => {
    expect(validarDistribuicaoAntecedenteDnd('soldado', { FOR: 2, DES: 1 })).toEqual([])
    expect(validarDistribuicaoAntecedenteDnd('soldado', { FOR: 1, DES: 1, CON: 1 })).toEqual([])
    expect(validarDistribuicaoAntecedenteDnd('soldado', { FOR: 2, SAB: 1 })).not.toEqual([])
    expect(validarDistribuicaoAntecedenteDnd('soldado', { FOR: 2, DES: 2 })).not.toEqual([])
  })
  it('aplica os +3 uma única vez e permite reorganização usando o DELTA', () => {
    const base = nova('Soldado')
    base.atributos = { ...base.atributos, FOR: 15, DES: 12, CON: 13 }
    const a = aplicarAntecedenteDnd(base, { FOR: 2, CON: 1 }, kit)
    expect(a.ok).toBe(true)
    if (!a.ok) return
    expect(a.dados.atributos).toMatchObject({ FOR: 17, CON: 14, DES: 12 })
    expect(validarAlteracoesAntecedenteDnd(base, a.dados)).toEqual([])
    const repetir = aplicarAntecedenteDnd(a.dados, { FOR: 2, CON: 1 }, kit)
    expect(repetir.ok).toBe(true)
    if (!repetir.ok) return
    expect(repetir.dados.atributos).toEqual(a.dados.atributos)
    const mudar = aplicarAntecedenteDnd(a.dados, { DES: 2, FOR: 1 }, { equipamento: 'moedas', ferramentaEscolhida: 'Xadrez' })
    expect(mudar.ok).toBe(true)
    if (!mudar.ok) return
    expect(mudar.dados.atributos).toMatchObject({ FOR: 16, DES: 14, CON: 13 })
    expect(validarAlteracoesAntecedenteDnd(a.dados, mudar.dados)).toEqual([])
  })
  it('limite 20 impede aplicar bônus na ficha se já atingir 21', () => {
    const base = nova('Soldado')
    base.atributos.FOR = 19
    const a = aplicarAntecedenteDnd(base, { FOR: 2, DES: 1 }, kit)
    expect(a.ok).toBe(false)
  })
  it('mudança do Soldado para Forasteiro substitui os aumentos sem apagar outros dados', () => {
    const a = aplicarAntecedenteDnd(nova('Soldado'), { FOR: 2, DES: 1 }, kit)
    expect(a.ok).toBe(true)
    if (!a.ok) return
    const novo = { ...a.dados, campos: { ...a.dados.campos, antecedente: 'Forasteiro' } }
    const f = aplicarAntecedenteDnd(novo, { SAB: 2, CAR: 1 }, { talento: 'alerta', instrumento: 'Flauta', idioma: 'Élfico' })
    expect(f.ok).toBe(true)
    if (!f.ok) return
    expect(f.dados.atributos).toMatchObject({ FOR: 10, DES: 10, SAB: 12, CAR: 11 })
    expect(validarAlteracoesAntecedenteDnd(novo, f.dados, fontesLiberadas([FONTE_LEGADO_2014]))).toEqual([])
    expect(etapasCriacaoDnd2024(f.dados).find(e => e.id === 'antecedente')?.estado).toBe('registrado')
  })
  it('Forasteiro respeita permissão da fonte de 2014 e do talento comercial', () => {
    const base = nova('Forasteiro')
    const r = aplicarAntecedenteDnd(base, { FOR: 2, CON: 1 }, { talento: 'tough', instrumento: 'Alaúde', idioma: 'Anão' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(validarAlteracoesAntecedenteDnd(base, r.dados, fontesLiberadas([]))).not.toEqual([])
    expect(validarAlteracoesAntecedenteDnd(base, r.dados, fontesLiberadas([FONTE_LEGADO_2014]))).not.toEqual([])
    expect(validarAlteracoesAntecedenteDnd(base, r.dados, fontesLiberadas([FONTE_LEGADO_2014, 'phb2024']))).toEqual([])
    expect(validarFontesCamposDnd({ campos: {} }, { campos: { antecedente: 'Forasteiro' } }, fontesLiberadas([]))).not.toEqual([])
    expect(validarFontesCamposDnd({ campos: {} }, { campos: { antecedente: 'Forasteiro' } }, fontesLiberadas([FONTE_LEGADO_2014]))).toEqual([])
  })
  it('Forasteiro: proficiência em Atletismo e Sobrevivência; Alerta é único', () => {
    const b = nova('Forasteiro')
    b.dndAntecedente = { id: 'forasteiro', aumentos: { FOR: 2, CON: 1 }, talento: 'alerta', instrumento: 'Flauta', idioma: 'Anão' }
    const efeitos = efeitosDnd2024(b, { mod_DES: 1, mod_CON: 0, mod_SAB: 1 })
    expect(efeitos.treino.atletismo?.fonte).toContain('Forasteiro')
    expect(efeitos.treino.sobrevivencia?.fonte).toContain('Forasteiro')
    expect(efeitos.vars.dnd_ini_extra).toBe(2)
    const outro = { ...b, campos: { ...b.campos, antecedente: 'Soldado' } }
    expect(efeitosDnd2024(outro, { mod_DES: 1 }).vars.dnd_ini_extra).toBe(0)
  })
  it('não aceita registro malformado nem tenta aplicar dados ao salvar quando não mudaram', () => {
    const b = nova('Soldado')
    expect(lerRegistroAntecedenteDnd({ id: 'soldado', aumentos: { XP: 3 } })).toBeNull()
    b.dndAntecedente = { id: 'soldado', aumentos: { FOR: 2, DES: 1 }, equipamento: 'pacote' }
    expect(validarAlteracoesAntecedenteDnd(b, b)).toEqual([])
  })
})
