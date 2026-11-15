import {describe,it,expect} from 'vitest'
import {niveisVida2014,pvPorNivel2014,validarVida2014} from './dnd2014Vitalidade'
import type {DadosFicha} from './tipos'
const d={campos:{classe:'Guerreiro',nivel:5},dnd2014Multiclasse:{mago:2}} as unknown as DadosFicha
describe('PV por nível 2014',()=>{
 it('dado máximo apenas no primeiro nível de personagem, médias nas outras classes',()=>{
  expect(niveisVida2014(d).filter(x=>x.inicial)).toHaveLength(1)
  expect(pvPorNivel2014(d,2)).toBe(10+2*6+2*4+5*2)
 })
 it('troca média por resultado rolado e aplica CON retroativa com mínimo 1 por nível',()=>{
  const r={...d,dnd2014VidaRolada:{'guerreiro:2':1,'mago:1':6}}
  expect(pvPorNivel2014(r,2)).toBe(37)
  expect(pvPorNivel2014(r,3)).toBe(42)
  expect(pvPorNivel2014(r,-5)).toBe(9)
 })
 it('recusa rolagem de nível futuro, dado fora do intervalo, nível 1 inicial e edição errada',()=>{
  for(const registro of ([{'mago:3':4},{'mago:1':7},{'guerreiro:1':3}] as Record<string,number>[]))
   expect(validarVida2014(d,{...d,dnd2014VidaRolada:registro},'phb2014')).not.toEqual([])
  expect(validarVida2014(d,{...d,dnd2014VidaRolada:{'mago:1':6}},'phb2014')).toEqual([])
  expect(validarVida2014(d,{...d,dnd2014VidaRolada:{}},'phb2024')).not.toEqual([])
 })
})
