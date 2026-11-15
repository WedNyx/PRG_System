import {describe,it,expect} from 'vitest'
import {fichaVazia,normalizarFicha} from './calculo'
import {sistemaPorId} from './catalogo'
import {lerMagias2014,validarAlteracoesMagias2014} from './dnd2014Magias'
const s=sistemaPorId('dnd5e-srd')!
describe('Componentes e tempo de conjuração PHB 2014',()=>{
 const f=()=>{const d=fichaVazia(s);d.campos={...d.campos,classe:'Mago',nivel:5};d.dndLivros={base:'phb2014',suplementos:[]};return d}
 const magia=()=>({
  nome:'Mísseis Mágicos',classe:'mago',fonte:'phb2014',nivel:1,modo:'preparada',
  tempoConjuracao:'ação',componentes:{
   verbal:true,somatico:true,material:true,descricao:'Material confirmado pelo jogador',custoPo:25,consumido:true,
  }
 } as const)
 it('persiste V/S/M e custo/consumo sem inventar efeito de magia',()=>{
  const d=f()
  d.dnd2014Magias=lerMagias2014([magia()])
  expect(d.dnd2014Magias[0].componentes).toEqual(magia().componentes)
  expect(d.dnd2014Magias[0].tempoConjuracao).toBe('ação')
  expect(normalizarFicha(s,d).dnd2014Magias).toEqual(d.dnd2014Magias)
 })
 it('bloqueia componentes malformados e não mistura 2024',()=>{
  const d=f()
  const nova={...d,dnd2014Magias:lerMagias2014([magia()])}
  expect(validarAlteracoesMagias2014(d,nova,'phb2014')).toEqual([])
  expect(validarAlteracoesMagias2014(d,{
    ...nova,dnd2014Magias:[{...nova.dnd2014Magias[0],componentes:{
     verbal:true,somatico:true,material:true,descricao:'reagente',custoPo:-5,
    }}]
  },'phb2014').length).toBeGreaterThan(0)
  expect(validarAlteracoesMagias2014(d,nova,'phb2024').length).toBeGreaterThan(0)
 })
})
