import { describe, it, expect } from 'vitest'
import { XP_MINIMOS_2014, nivelParaXp2014, xpParaNivel2014, progressoXp2014, validarExperiencia2014 } from './dnd2014Experiencia'

describe('PHB 2014: avanço do nível 1 ao 20',()=>{
  it('usa exatamente a tabela de XP, sem misturar edição 2024 ou subclasses',()=>{
    expect(XP_MINIMOS_2014).toHaveLength(20)
    expect(XP_MINIMOS_2014).toEqual([0,300,900,2700,6500,14000,23000,34000,48000,64000,
      85000,100000,120000,140000,165000,195000,225000,265000,305000,355000])
    for(let n=1;n<=20;n++){
      const minimo=xpParaNivel2014(n)
      expect(nivelParaXp2014(minimo)).toBe(n)
      if(n>1)expect(nivelParaXp2014(minimo-1)).toBe(n-1)
    }
  })
  it('não força subir de nível: campanhas por marcos são válidas',()=>{
    expect(progressoXp2014(900,2)).toEqual({xp:900,nivel:2,nivelPeloXp:3,proximo:900,faltam:0})
    expect(progressoXp2014(355000,20).proximo).toBeNull()
  })
  it('rejeita XP negativo, fracionário ou inválido somente quando alterado em 2014',()=>{
    const a={campos:{xp:0}}, b={campos:{xp:-1}}
    expect(validarExperiencia2014(a,b,'phb2014')).toHaveLength(1)
    expect(validarExperiencia2014(a,{campos:{xp:1.5}},'phb2014')).toHaveLength(1)
    expect(validarExperiencia2014(a,{campos:{xp:300}},'phb2014')).toEqual([])
    expect(validarExperiencia2014(a,b,'phb2024')).toEqual([])
  })
})
