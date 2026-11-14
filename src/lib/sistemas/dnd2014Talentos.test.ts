import {describe,expect,it} from 'vitest'
import {TALENTOS_PHB_2014,limitesTalentos2014,validarTalentos2014} from './dnd2014Talentos'
import type {DadosFicha} from './tipos'

function criar(classe:string,nivel:number,outras:Record<string,number>={},variante=false):DadosFicha{
  return {campos:{classe,nivel,especie:'Humano',subraca2014:variante?'Humano Variante':'Humano padrão'},
    dnd2014Multiclasse:outras, dnd2014Talentos:[]} as unknown as DadosFicha
}
describe('Talentos PHB 2014 — opções e níveis de classes',()=>{
  it('indexa 42 nomes distintos do capítulo 6, não reutiliza talentos de 2024',()=>{
    expect(TALENTOS_PHB_2014).toHaveLength(42)
    expect(new Set(TALENTOS_PHB_2014).size).toBe(42)
    expect(TALENTOS_PHB_2014).toContain('SORTUDO')
    expect(TALENTOS_PHB_2014).toContain('INICIADO EM MAGIA')
    expect(TALENTOS_PHB_2014).not.toContain('Iniciado em Magia (2024)')
  })
  it('não concede talento geral até chegar ao primeiro incremento da classe',()=>{
    expect(limitesTalentos2014(criar('Mago',3)).total).toBe(0)
    expect(limitesTalentos2014(criar('Mago',4)).total).toBe(1)
    expect(limitesTalentos2014(criar('Mago',20)).total).toBe(5)
    expect(limitesTalentos2014(criar('Guerreiro',20)).total).toBe(7)
    expect(limitesTalentos2014(criar('Ladino',20)).total).toBe(6)
  })
  it('Humano Variante recebe exatamente uma escolha extra no 1º nível',()=>{
    expect(limitesTalentos2014(criar('Mago',1,{},true)).total).toBe(1)
    expect(limitesTalentos2014(criar('Guerreiro',6,{},true)).total).toBe(3)
  })
  it('conta incrementos por nível individual de multiclasse, não nível total',()=>{
    expect(limitesTalentos2014(criar('Guerreiro',7,{mago:4})).total).toBe(1)
    expect(limitesTalentos2014(criar('Guerreiro',8,{mago:4})).total).toBe(2)
  })
  it('valida escolha única, edição, pré-requisito de nível, e exceção pelo mestre',()=>{
    const base=criar('Mago',3)
    const novo={...base,dnd2014Talentos:['SORTUDO']}
    expect(validarTalentos2014(base,novo,'phb2014').length).toBeGreaterThan(0)
    expect(validarTalentos2014(base,novo,'phb2014',true)).toEqual([])
    expect(validarTalentos2014(base,novo,'phb2024').length).toBeGreaterThan(0)
    expect(validarTalentos2014(base,{...base,campos:{...base.campos,nivel:4},dnd2014Talentos:['ALERTA']},'phb2014')).toEqual([])
    expect(validarTalentos2014(base,{...base,campos:{...base.campos,nivel:4},dnd2014Talentos:['ALERTA','ALERTA']},'phb2014').length).toBeGreaterThan(0)
  })
})
