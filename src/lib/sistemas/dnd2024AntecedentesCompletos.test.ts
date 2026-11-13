import { describe, expect, it } from 'vitest'
import { ANTECEDENTES_PHB } from './dnd2024Fontes'
import { ANTECEDENTES_PHB_GUIA } from './dnd2024AntecedentesPhb'
import { MAGIAS_SRD } from './dnd2024Magias'
import { calcular, fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'
import {
  ANTECEDENTES_GUIADOS, ATRIBUTOS_DND, aplicarAntecedenteDnd,
  validarAlteracoesAntecedenteDnd, validarDetalhesAntecedenteDnd,
  validarDistribuicaoAntecedenteDnd, type ModeloAntecedenteDnd, type RegistroAntecedenteDnd,
} from './dnd2024Antecedentes'
import { fontesLiberadas } from './dnd2024Fontes'

const sistema = sistemaPorId('dnd5e-srd')!
const criar = (nome: string) => {
  const d = fichaVazia(sistema)
  d.campos = { ...d.campos, antecedente: nome, classe: 'Guerreiro', nivel: 1 }
  return d
}
const extras = (b: ModeloAntecedenteDnd): Partial<RegistroAntecedenteDnd> => {
  const e: Partial<RegistroAntecedenteDnd> = { equipamento: 'pacote' }
  if (b.ferramentaEscolha) e.ferramentaEscolhida = 'Kit escolhido'
  if (b.talentoId === 'habilidoso') e.talentoPericias = ['arcanismo', 'medicina', 'religiao']
  if (b.talentoId === 'crafter' || b.talentoId === 'musician')
    e.talentoFerramentas = ['Opção A', 'Opção B', 'Opção C']
  if (b.talentoId?.startsWith('iniciado-magia')) {
    const classe = b.talentoId.endsWith('clerigo') ? 'clerigo' : b.talentoId.endsWith('druida') ? 'druida' : 'mago'
    const truques = MAGIAS_SRD.filter(m => m.nivel === 0 && m.classes.includes(classe)).slice(0, 2)
    const magia = MAGIAS_SRD.find(m => m.nivel === 1 && m.classes.includes(classe))
    e.talentoAtributo = 'SAB'
    e.talentoLista = classe
    e.talentoMagias = [...truques.map(m => m.id), magia!.id]
  }
  return e
}

describe('16 antecedentes PHB 2024 + Forasteiro legado', () => {
  it('os 12 novos possuem metadados factuais completos e quatro do SRD seguem disponíveis', () => {
    expect(Object.keys(ANTECEDENTES_PHB_GUIA).sort()).toEqual(ANTECEDENTES_PHB.map(([id]) => id).sort())
    const phb = Object.values(ANTECEDENTES_PHB_GUIA)
    expect(phb).toHaveLength(12)
    expect(Object.keys(ANTECEDENTES_GUIADOS)).toHaveLength(17)
    for (const b of phb) {
      expect(b.fonte).toBe('phb2024')
      expect(b.elegiveis).toHaveLength(3)
      expect(new Set(b.elegiveis).size).toBe(3)
      expect(b.elegiveis.every(a => ATRIBUTOS_DND.includes(a))).toBe(true)
      expect(b.pericias).toHaveLength(2)
      expect(b.talentoId).toBeTruthy()
      expect(b.ferramenta).toBeTruthy()
      expect((b.pacote ?? []).length).toBeGreaterThan(1)
      expect((b.moedasPacote ?? 0)).toBeGreaterThan(0)
    }
    expect(ANTECEDENTES_GUIADOS.forasteiro.fonte).toBe('phb2014')
  })
  it('cada um dos 16 aplica e registra +2/+1 com validação de fonte, perícias e detalhes próprios', () => {
    for (const b of Object.values(ANTECEDENTES_GUIADOS).filter(v => v.fonte !== 'phb2014')) {
      const [a1, a2, a3] = b.elegiveis
      const distribuicao = { [a1]: 2, [a2]: 1 }
      expect(validarDistribuicaoAntecedenteDnd(b.id, distribuicao)).toEqual([])
      expect(validarDistribuicaoAntecedenteDnd(b.id, { [a1]: 1, [a2]: 1, [a3]: 1 })).toEqual([])
      const base = criar(b.nome)
      const r = aplicarAntecedenteDnd(base, distribuicao, extras(b))
      expect(r.ok, b.nome).toBe(true)
      if (!r.ok) continue
      expect(validarDetalhesAntecedenteDnd(r.dados.dndAntecedente!), b.nome).toEqual([])
      expect(validarAlteracoesAntecedenteDnd(base, r.dados, fontesLiberadas(['phb2024'])), b.nome).toEqual([])
      const calculos = calcular(sistema, r.dados)
      for (const id of b.pericias) {
        expect(calculos.automaticos?.[id], b.nome + '/' + id).toBe(b.nome)
      }
      const repetir = aplicarAntecedenteDnd(r.dados, distribuicao, extras(b))
      expect(repetir.ok, b.nome).toBe(true)
      if (repetir.ok) expect(repetir.dados.atributos).toEqual(r.dados.atributos)
    }
  })
  it('não permite usar dados de antecedente PHB em campanha sem o livro liberado', () => {
    const b = ANTECEDENTES_PHB_GUIA.guarda
    const d = criar(b.nome)
    const r = aplicarAntecedenteDnd(d, { FOR: 2, SAB: 1 }, extras(b))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(validarAlteracoesAntecedenteDnd(d, r.dados, fontesLiberadas([]))).not.toEqual([])
    expect(validarAlteracoesAntecedenteDnd(d, r.dados, fontesLiberadas(['phb2024']))).toEqual([])
  })
  it('Alerta do Guarda e Criminoso acrescenta proficiência à Iniciativa apenas uma vez', () => {
    for (const bg of ['Guarda', 'Criminoso']) {
      const d = criar(bg)
      d.atributos.DES = 14
      d.campos.nivel = 5
      const c = calcular(sistema, d)
      expect(c.vars.dnd_ini_extra).toBe(3)
      expect(c.derivados.iniciativa).toBe(5)
    }
  })
  it('Robusto do Fazendeiro acrescenta 2 PV por nível sem acumular com o Humano Versátil', () => {
    const d = criar('Fazendeiro')
    d.campos.nivel = 5
    expect(calcular(sistema, d).vars.dnd_pv_extra).toBe(10)
    d.campos.especie = 'Humano'
    d.dndEscolhas = { 'esp-humano-versatil': 'tough' }
    expect(calcular(sistema, d).vars.dnd_pv_extra).toBe(10)
    d.campos.antecedente = 'Soldado'
    expect(calcular(sistema, d).vars.dnd_pv_extra).toBe(10)
  })
  it('Sortudo do Mercador/Viajante concede pontos conforme a proficiência', () => {
    for (const bg of ['Mercador', 'Viajante']) {
      const d = criar(bg)
      d.campos.nivel = 5
      const c = calcular(sistema, d)
      expect(c.vars.dnd_sorte).toBe(3)
      expect(c.recursosMax.pontos_sorte).toBe(3)
    }
  })
  it('Habilidoso aplica somente as perícias registradas, sem duplicar o grau', () => {
    const bg = ANTECEDENTES_PHB_GUIA.charlatao
    const d = criar(bg.nome)
    const r = aplicarAntecedenteDnd(d, { DES: 2, CON: 1 }, extras(bg))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const c = calcular(sistema, r.dados)
    expect(c.automaticos?.arcanismo).toContain('Habilidoso')
    r.dados.campos.antecedente = 'Soldado'
    expect(calcular(sistema, r.dados).automaticos?.arcanismo).toBeUndefined()
  })
  it('Iniciado em Magia rejeita escolhas ausentes ou incompatíveis com a lista', () => {
    const d = criar('Guia')
    const bg = ANTECEDENTES_PHB_GUIA.guia
    const base = { id: bg.id, aumentos: { DES: 2, SAB: 1 }, ...extras(bg) }
    expect(validarDetalhesAntecedenteDnd(base)).toEqual([])
    expect(validarDetalhesAntecedenteDnd({ ...base, talentoMagias: ['acid-splash', 'acid-splash', 'magic-missile'] })).not.toEqual([])
    expect(validarDetalhesAntecedenteDnd({ ...base, talentoAtributo: undefined })).not.toEqual([])
    const r = aplicarAntecedenteDnd(d, { DES: 2, SAB: 1 }, extras(bg))
    expect(r.ok).toBe(true)
  })
})
