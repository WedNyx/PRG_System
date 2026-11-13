import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { CLASSES_SRD } from './dnd2024Srd'
import { MARCOS_ORIGENS_SRD } from './dnd2024Origens'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { ANTECEDENTES_PHB, ESPECIES_PHB, SUBCLASSES_PHB, FONTE_PHB } from './dnd2024Fontes'

/** Guarda a cobertura NOMINAL; não substitui revisão detalhada de cada regra.
 * PHB 2024: 10 espécies, 16 antecedentes, 12 classes e 48 subclasses.
 * SRD 5.2.1 (CC BY 4.0): 9 espécies, 4 antecedentes, 12 classes e 12 subclasses.
 */
describe('auditoria nominal das origens e classes D&D 2024', () => {
  it('as 12 classes estão cadastradas, com uma subclasse SRD cada', () => {
    expect(CLASSES_SRD).toHaveLength(12)
    expect(new Set(CLASSES_SRD.map(c => c.id)).size).toBe(12)
    expect(CLASSES_SRD.every(c => c.subclasse?.id && c.dv > 0 && c.salvaguardas.length === 2)).toBe(true)
    for (const c of CLASSES_SRD) {
      const marco = MARCOS_DND_2024.find(m => m.id === c.id + '-subclasse')
      expect(marco?.nivel).toBe(3)
      expect(marco?.opcoes).toHaveLength(4)
      expect(marco?.opcoes?.filter(o => o.fonte === FONTE_PHB)).toHaveLength(3)
    }
    expect(Object.keys(SUBCLASSES_PHB)).toHaveLength(12)
    expect(Object.values(SUBCLASSES_PHB).every(s => s.length === 3)).toBe(true)
  })
  it('as 10 espécies do PHB existem e apenas Aasimar não consta no SRD', () => {
    const s = sistemaPorId('dnd5e-srd')!
    const selecionadas = s.campos.find(c => c.id === 'especie')?.opcoes ?? []
    const idsSrd = [...new Set(MARCOS_ORIGENS_SRD.filter(m => m.origem === 'especie').map(m => m.origemId))]
    expect(idsSrd.sort()).toEqual(['anao','draconato','elfo','gnomo','golias','halfling','humano','orc','tiferino'].sort())
    expect(selecionadas).toHaveLength(10)
    expect(ESPECIES_PHB).toEqual([['aasimar', 'Aasimar']])
    expect(selecionadas.find(op => op.nome === 'Aasimar')?.fonte).toBe(FONTE_PHB)
  })
  it('linhagens e ancestralidades do SRD têm os números de escolhas corretos', () => {
    const tamanhos = [
      ['esp-elfo-linhagem',3], ['esp-gnomo-linhagem',2], ['esp-tiferino-legado',3],
      ['esp-draconato-ancestral',10], ['esp-golias-ancestralidade',6],
    ] as const
    for (const [id, quantidade] of tamanhos) {
      expect(MARCOS_ORIGENS_SRD.find(m => m.id === id)?.opcoes).toHaveLength(quantidade)
    }
  })
  it('os 4 antecedentes SRD e os 12 nomes extras do PHB completam 16', () => {
    const s = sistemaPorId('dnd5e-srd')!
    const idsSrd = [...new Set(MARCOS_ORIGENS_SRD.filter(m => m.origem === 'antecedente').map(m => m.origemId))]
    expect(idsSrd.sort()).toEqual(['acolito','criminoso','sabio','soldado'].sort())
    expect(ANTECEDENTES_PHB).toHaveLength(12)
    expect(s.campos.find(c => c.id === 'antecedente')?.opcoes).toHaveLength(16)
  })
})
