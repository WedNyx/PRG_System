import {describe,it,expect} from 'vitest'
import {fichaVazia,normalizarFicha} from './calculo'
import {sistemaPorId} from './catalogo'
import {aplicarDescanso} from './descanso'
import {conjurarArcanaMistica2014,validarArcanasMisticas2014,nivelBruxoArcana2014} from './dnd2014ArcanaMistica'
import {lerMagias2014} from './dnd2014Magias'
const s=sistemaPorId('dnd5e-srd')!
function ficha(nivel:number){
 const d=fichaVazia(s)
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.campos={...d.campos,classe:'Bruxo',nivel}
 d.dnd2014Magias=lerMagias2014([{nome:'Círculo da Morte',nivel:6,classe:'bruxo',fonte:'phb2014',modo:'extra',arcanaMistica:true}])
 return d
}
describe('Etapa 3 — Arcana Mística PHB 2014',()=>{
 it('exige nível de Bruxo e um uso do 6º círculo sem gastar slot de pacto',()=>{
  const d=ficha(11)
  expect(nivelBruxoArcana2014(d)).toBe(11)
  expect(validarArcanasMisticas2014({...d,dnd2014Magias:[]},d,'phb2014')).toEqual([])
  const proxima=conjurarArcanaMistica2014(d,d.dnd2014Magias![0].id)!
  expect(proxima.dnd2014ArcanasUsadas).toEqual([6])
  expect(proxima.recursos).toEqual(d.recursos)
  expect(conjurarArcanaMistica2014(proxima,d.dnd2014Magias![0].id)).toBeNull()
  expect(normalizarFicha(s,proxima).dnd2014ArcanasUsadas).toEqual([6])
 })
 it('após descanso curto permanece usada; descanso longo recupera',()=>{
  const d=ficha(11),gasto=conjurarArcanaMistica2014(d,d.dnd2014Magias![0].id)!
  expect(aplicarDescanso(s,gasto,'curto').d.dnd2014ArcanasUsadas).toEqual([6])
  const longo=aplicarDescanso(s,gasto,'longo')
  expect(longo.d.dnd2014ArcanasUsadas).toEqual([])
  expect(conjurarArcanaMistica2014(longo.d,d.dnd2014Magias![0].id)?.dnd2014ArcanasUsadas).toEqual([6])
 })
 it('não aceita Arcana prematura, duplicada nem ficha 2024',()=>{
  const d=ficha(10)
  expect(validarArcanasMisticas2014({...d,dnd2014Magias:[]},d,'phb2014').length).toBeGreaterThan(0)
  expect(conjurarArcanaMistica2014(d,d.dnd2014Magias![0].id)).toBeNull()
  const duplicado=ficha(20)
  duplicado.dnd2014Magias=lerMagias2014([
   ...duplicado.dnd2014Magias!,
   {nome:'Conjurar Fada',nivel:6,classe:'bruxo',fonte:'phb2014',modo:'extra',arcanaMistica:true}
  ])
  expect(validarArcanasMisticas2014({...duplicado,dnd2014Magias:[]},duplicado,'phb2014').length).toBeGreaterThan(0)
  expect(validarArcanasMisticas2014({...duplicado,dnd2014Magias:[]},duplicado,'phb2024').length).toBeGreaterThan(0)
 })
 it('multiclasse usa nível do bruxo, nunca nível geral de personagem',()=>{
  const d=ficha(13)
  d.campos.classe='Guerreiro';d.dnd2014Multiclasse={bruxo:3}
  expect(nivelBruxoArcana2014(d)).toBe(3)
  expect(conjurarArcanaMistica2014(d,d.dnd2014Magias![0].id)).toBeNull()
 })
})
