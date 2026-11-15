import {describe,expect,it} from 'vitest'
import {efeitosDnd2014} from './dnd2014Regras'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'

describe('Etapa 3 — talentos 2014 com bônus verificáveis',()=>{
 it('ALERTA concede +5 iniciativa, ROBUSTO +2 PV por nível e SORTUDO 3 pontos, não escala como 2024',()=>{
  const d=fichaVazia(sistemaPorId('dnd5e-srd')!)
  d.campos={...d.campos,nivel:9,classe:'Mago'}
  d.dnd2014Talentos=['ALERTA','ROBUSTO','SORTUDO']
  const {vars}=efeitosDnd2014(d,{})
  expect(vars.dnd_ini_extra).toBe(5)
  expect(vars.dnd_pv_extra).toBe(18)
  expect(vars.dnd_sorte).toBe(3)
  d.dnd2014Talentos=[]
  const sem=efeitosDnd2014(d,{}).vars
  expect(sem.dnd_ini_extra).toBe(0)
  expect(sem.dnd_pv_extra).toBe(0)
  expect(sem.dnd_sorte).toBe(0)
 })
 it('ao mudar nível, robusto acompanha nivel total de personagem sem incremento cumulativo',()=>{
  const d=fichaVazia(sistemaPorId('dnd5e-srd')!)
  d.campos={...d.campos,nivel:1,classe:'Guerreiro'}
  d.dnd2014Talentos=['ROBUSTO']
  expect(efeitosDnd2014(d,{}).vars.dnd_pv_extra).toBe(2)
  d.campos.nivel=20
  expect(efeitosDnd2014(d,{}).vars.dnd_pv_extra).toBe(40)
  expect(efeitosDnd2014(d,{}).vars.dnd_pv_extra).toBe(40)
 })
})
