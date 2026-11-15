import { describe,expect,it } from 'vitest'
import { marcosDaClasse2014, NIVEIS_INCREMENTO_CLASSES_2014 } from './dnd2014Marcos'
import { CLASSES_SRD } from './dnd2024Srd'
import { marcosIncremento2014 } from './dnd2014Atributos'

describe('D&D 2014: referências de progressão do nível 1 ao 20',()=>{
  it('todas 12 classes têm marcos organizados, incrementos 2014 sem misturar 2024',()=>{
    expect(CLASSES_SRD).toHaveLength(12)
    for(const classe of CLASSES_SRD) {
      const a=marcosDaClasse2014(classe.nome)
      expect(a.length,classe.nome).toBeGreaterThanOrEqual(12)
      expect(a[0].nivel,classe.nome).toBe(1)
      expect(a.every(x=>Number.isInteger(x.nivel)&&x.nivel>=1&&x.nivel<=20),classe.nome).toBe(true)
      expect(a.every((x,i)=>!i||x.nivel>=a[i-1].nivel),classe.nome).toBe(true)
      const marco=marcosIncremento2014({campos:{classe:classe.nome,nivel:20}})
      expect(a.filter(x=>x.nome.startsWith('Incremento no Valor')).map(x=>x.nivel))
        .toEqual(marco.map(x=>Number(x.id.split(':')[1])))
    }
  })
  it('Guerreiro e Ladino têm incrementos extras',()=>{
    expect(NIVEIS_INCREMENTO_CLASSES_2014['Guerreiro']).toEqual([4,6,8,12,14,16,19])
    expect(NIVEIS_INCREMENTO_CLASSES_2014['Ladino']).toEqual([4,8,10,12,16,19])
  })
  it('níveis futuros continuam sendo apenas referência visual',()=>{
    const alto=marcosDaClasse2014('Mago').filter(x=>x.nivel===18)
    expect(alto.some(x=>x.nome.includes('Maestria'))).toBe(true)
    expect(alto.every(x=>!x.automatico)).toBe(true)
  })
})
