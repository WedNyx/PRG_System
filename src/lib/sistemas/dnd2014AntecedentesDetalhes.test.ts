import { describe, expect, it } from 'vitest'
import { ANTECEDENTES_DETALHES_2014, detalhesAntecedente2014,
  diagnosticarEscolhasAntecedente2014, validarEscolhasAntecedente2014 } from './dnd2014AntecedentesDetalhes'
import { ANTECEDENTES_2014 } from './dnd2014Criacao'
import { normalizarFicha, fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'
import { categoria } from '../nuvem/categorias'

describe('PHB 2014: proficiências de ferramentas e idiomas dos antecedentes',()=>{
  it('registra opções e equipamentos de referência de todos 13 antecedentes',()=>{
    expect(ANTECEDENTES_DETALHES_2014).toHaveLength(13)
    expect(new Set(ANTECEDENTES_DETALHES_2014.map(x=>x.nome)).size).toBe(13)
    expect(ANTECEDENTES_DETALHES_2014.map(x=>x.nome).sort()).toEqual(ANTECEDENTES_2014.map(x=>x.nome).sort())
    for(const b of ANTECEDENTES_DETALHES_2014){
      expect(b.idiomas).toBeGreaterThanOrEqual(0)
      expect(b.equipamentos.length).toBeGreaterThan(5)
      expect(b.ferramentasFixas.length+b.ferramentasLivres+b.idiomas).toBeGreaterThan(0)
    }
  })
  it('Forasteiro concede um idioma e um instrumento musical de escolha',()=>{
    const b=detalhesAntecedente2014('Forasteiro')!
    expect(b.idiomas).toBe(1)
    expect(b.ferramentasLivres).toBe(1)
    expect(b.tipoFerramenta).toContain('Instrumento')
  })
  it('Acólito registra dois idiomas; Artista, Criminoso e Soldado exigem escolhas corretas',()=>{
    expect(detalhesAntecedente2014('Acólito')?.idiomas).toBe(2)
    expect(detalhesAntecedente2014('Criminoso')?.ferramentasFixas).toContain('Ferramentas de ladrão')
    expect(detalhesAntecedente2014('Soldado')?.ferramentasFixas).toContain('Veículos terrestres')
  })
  it('não altera escolhas de 2024, preserva JSON de 2014, rejeita excesso e duplicação',()=>{
    const d=fichaVazia(sistemaPorId('dnd5e-srd')!)
    d.campos={...d.campos,antecedente:'Forasteiro'}
    const novo={...d,dnd2014AntecedenteExtras:{antecedente:'Forasteiro',idiomas:['Élfico'],ferramentas:['Flauta']}}
    expect(validarEscolhasAntecedente2014(d,novo,'phb2014')).toEqual([])
    expect(diagnosticarEscolhasAntecedente2014(novo)).toEqual([])
    expect(normalizarFicha(sistemaPorId('dnd5e-srd')!,JSON.parse(JSON.stringify(novo))).dnd2014AntecedenteExtras)
      .toEqual(novo.dnd2014AntecedenteExtras)
    expect(categoria('dnd5e-srd','dnd2014AntecedenteExtras')).toBe('pericias')
    expect(validarEscolhasAntecedente2014(d,novo,'phb2024')).toHaveLength(1)
    expect(validarEscolhasAntecedente2014(d,{...novo,dnd2014AntecedenteExtras:{...novo.dnd2014AntecedenteExtras,idiomas:['Élfico','Anão']}},'phb2014')).toHaveLength(1)
    const a={...d,campos:{...d.campos,antecedente:'Acólito'}}
    expect(validarEscolhasAntecedente2014(d,{...a,dnd2014AntecedenteExtras:{antecedente:'Acólito',idiomas:['Élfico','Élfico'],ferramentas:[]}},'phb2014')).toHaveLength(1)
  })
})
