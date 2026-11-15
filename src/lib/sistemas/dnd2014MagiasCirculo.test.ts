import {describe,it,expect} from 'vitest'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
import {MAGIAS_CIRCULO_TERRA_2014,magiasCirculoTerra2014} from './dnd2014MagiasCirculo'
import {limiteTruques2014} from './dnd2014PreparacaoMagias'
const s=sistemaPorId('dnd5e-srd')!
function f(nivel:number){
 const d=fichaVazia(s)
 d.campos={...d.campos,classe:'Druida',nivel}
 d.dnd2014Subclasse='terra'
 d.dnd2014EscolhasSubclasse={druida:{subclasse:'terra',grupos:{terreno:['Floresta']}}}
 return d
}
describe('PHB 2014: Círculo da Terra',()=>{
 it('oito terrenos, quatro marcos de duas magias',()=>{
  expect(Object.keys(MAGIAS_CIRCULO_TERRA_2014)).toHaveLength(8)
  for(const lista of Object.values(MAGIAS_CIRCULO_TERRA_2014)) {
   expect(lista.map(x=>x[0])).toEqual([3,5,7,9])
  }
 })
 it('magias sempre preparadas aparecem no 3/5/7/9 de DRUIDA',()=>{
  expect(magiasCirculoTerra2014(f(2))).toHaveLength(0)
  expect(magiasCirculoTerra2014(f(3)).map(x=>x.nome)).toEqual(['Patas de Aranha','Pele de Árvore'])
  expect(magiasCirculoTerra2014(f(5))).toHaveLength(4)
  expect(magiasCirculoTerra2014(f(7))).toHaveLength(6)
  expect(magiasCirculoTerra2014(f(9))).toHaveLength(8)
  expect(limiteTruques2014('druida',2,'terra')).toBe(3)
  expect(limiteTruques2014('druida',2,'lua')).toBe(2)
 })
 it('sem escolha do terreno, sem subclasse e fora do nível não ganha magias automaticamente',()=>{
  const d=f(9);d.dnd2014EscolhasSubclasse=undefined
  expect(magiasCirculoTerra2014(d)).toEqual([])
  d.dnd2014Subclasse='lua'
  expect(magiasCirculoTerra2014(d)).toEqual([])
 })
 it('em multiclasse, nível da classe define acesso',()=>{
  const d=f(12)
  d.campos.classe='Guerreiro';d.dnd2014Multiclasse={druida:3};d.dnd2014Subclasse='campeao'
  d.dnd2014Subclasses={druida:'terra'}
  expect(magiasCirculoTerra2014(d)).toHaveLength(2)
 })
})
