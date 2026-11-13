import { describe, expect, it } from 'vitest'
import { ANTECEDENTES_PHB, FONTE_PHB, fontePermitida, fontesLiberadas, FONTES_DND, SUBCLASSES_PHB, TALENTOS_ORIGEM_PHB, validarFontesCamposDnd } from './dnd2024Fontes'
import { MARCOS_DND_2024, MARCOS_SRD_2024 } from './dnd2024Marcos'
import { progressaoVisivel, validarMarcos } from './dnd2024Progressao'
import { progressoDaFichaDnd, validarAlteracoesEscolhasDnd } from './dnd2024Ficha'
import { lerConfiguracaoProgressao } from './modoProgressao'
import { sistemaPorId } from './catalogo'

describe('fontes de D&D 2024', () => {
  it('Livro do Jogador: 36 subclasses, 1 espécie e 12 antecedentes, só com nomes (sem texto de regra)', () => {
    expect(Object.values(SUBCLASSES_PHB).flat()).toHaveLength(36)
    expect(ANTECEDENTES_PHB).toHaveLength(12)
    const doLivro = MARCOS_DND_2024.filter(m => m.fonte.startsWith('Livro'))
    expect(doLivro.length).toBeGreaterThan(36)
    for (const m of doLivro) expect(m.descricao).toMatch(/consulte o Livro do Jogador/)
    expect(validarMarcos(MARCOS_DND_2024)).toEqual([])
    expect(MARCOS_SRD_2024.every(m => !m.fonte.startsWith('Livro'))).toBe(true)
  })
  it('PHB 2024: Clérigo tem Vida, Luz, Enganação e Guerra (não Conhecimento)', () => {
    const opcoes = MARCOS_DND_2024.find(m => m.id === 'clerigo-subclasse')?.opcoes ?? []
    expect(opcoes).toHaveLength(4)
    expect(opcoes.map(o => o.id).sort()).toEqual([
      'dominio-enganacao', 'dominio-guerra', 'dominio-luz', 'dominio-vida',
    ])
    expect(SUBCLASSES_PHB.clerigo.some(([id]) => id === 'dominio-conhecimento')).toBe(false)
  })
  it('Humano Versátil: 4 talentos abertos + 6 nomes do PHB, sujeitos às fontes liberadas', () => {
    const humano = MARCOS_DND_2024.find(m => m.id === 'esp-humano-versatil')
    expect(humano?.opcoes).toHaveLength(10)
    expect(humano?.opcoes?.filter(o => o.fonte === FONTE_PHB)).toHaveLength(6)
    expect(TALENTOS_ORIGEM_PHB).toHaveLength(6)
    const antes = { campos: { classe: 'Guerreiro', especie: 'Humano', nivel: 1 } }
    const depois = { ...antes, dndEscolhas: { 'esp-humano-versatil': 'tough' } }
    expect(validarAlteracoesEscolhasDnd(antes, depois, fontesLiberadas([]))).not.toEqual([])
    expect(validarAlteracoesEscolhasDnd(antes, depois, fontesLiberadas(['phb2024']))).toEqual([])
  })
  it('subclasse do livro ganha marcos nos níveis da subclasse do SRD e esconde o “Característica de subclasse” genérico', () => {
    const p = progressoDaFichaDnd({ campos: { classe: 'Guerreiro', nivel: 10 }, dndEscolhas: { 'guerreiro-subclasse': 'mestre-batalha' } })
    const vis = progressaoVisivel(MARCOS_DND_2024, p)
    expect(vis.filter(m => m.id.startsWith('guerreiro-mestre-batalha-')).map(m => m.nivel)).toEqual([3, 7, 10, 15, 18])
    expect(vis.some(m => m.id.startsWith('guerreiro-subclasse-n'))).toBe(false)
    expect(vis.some(m => m.id.startsWith('guerreiro-campeao-'))).toBe(false)
  })
  it('campo de espécie e antecedente marca as opções do livro', () => {
    const s = sistemaPorId('dnd5e-srd')!
    expect(s.campos.find(c => c.id === 'especie')?.opcoes?.find(o => o.nome === 'Aasimar')?.fonte).toBe(FONTE_PHB)
    expect(s.campos.find(c => c.id === 'antecedente')?.opcoes?.filter(o => o.fonte === FONTE_PHB)).toHaveLength(12)
  })
  it('liberação: SRD sempre; null = tudo; ids estranhos ignorados', () => {
    const l = fontesLiberadas(['phb2024', 'inventado'])
    expect([...l]).toEqual(['srd521', 'phb2024'])
    expect(fontePermitida(FONTE_PHB, fontesLiberadas([]))).toBe(false)
    expect(fontePermitida(FONTE_PHB, null)).toBe(true)
    expect(fontePermitida(undefined, fontesLiberadas([]))).toBe(true)
    expect(FONTES_DND.filter(f => f.tipo === 'comercial')).toHaveLength(4)
  })
  it('servidor: subclasse e antecedente do livro só com o livro liberado', () => {
    const antes = { campos: { classe: 'Guerreiro', nivel: 3 } }
    const depois = { ...antes, dndEscolhas: { 'guerreiro-subclasse': 'mestre-batalha' } }
    expect(validarAlteracoesEscolhasDnd(antes, depois, fontesLiberadas([]))[0]).toMatch(/não foi liberada/)
    expect(validarAlteracoesEscolhasDnd(antes, depois, fontesLiberadas(['phb2024']))).toEqual([])
    expect(validarAlteracoesEscolhasDnd(antes, depois, null)).toEqual([])
    expect(validarFontesCamposDnd({ campos: {} }, { campos: { antecedente: 'Nobre' } }, fontesLiberadas([]))[0]).toMatch(/Nobre/)
    expect(validarFontesCamposDnd({ campos: { antecedente: 'Nobre' } }, { campos: { antecedente: 'Nobre' } }, fontesLiberadas([]))).toEqual([])
    expect(validarFontesCamposDnd({ campos: {} }, { campos: { especie: 'Aasimar' } }, fontesLiberadas(['phb2024']))).toEqual([])
  })
  it('config da campanha guarda fontes e outros suplementos', () => {
    const c = lerConfiguracaoProgressao({ modo: 'hibrido', fontes: ['phb2024', 'phb2024', 'X Y'], fontesExtras: [' Aventura caseira ', '', 'a'.repeat(80)] })
    expect(c.fontes).toEqual(['phb2024']); expect(c.fontesExtras).toEqual(['Aventura caseira', 'a'.repeat(60)])
    expect(lerConfiguracaoProgressao({ modo: 'manual' }).fontes).toBeUndefined()
  })
})
