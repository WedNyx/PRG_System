import {describe,it,expect} from 'vitest'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
import {limiteMagiasPorClasse2014,resumoPreparacaoMagias2014} from './dnd2014PreparacaoMagias'
import {lerMagias2014,validarAlteracoesMagias2014} from './dnd2014Magias'
const s=sistemaPorId('dnd5e-srd')!
const classe=(nome:string,nivel:number)=>{
 const d=fichaVazia(s)
 d.campos={...d.campos,classe:nome,nivel}
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.atributos={...d.atributos,INT:16,SAB:16,CAR:16}
 return d
}
const magias=(classeId:string,modo:'preparada'|'conhecida',count:number)=>
 lerMagias2014(Array.from({length:count},(_,i)=>({
 nome:'Teste '+(i+1),nivel:1,classe:classeId,fonte:'phb2014',modo,
 })))
describe('Etapa 3 — preparação/conhecidas PHB 2014',()=>{
 it('prepara magias por modificador e nível da CLASSE; paladino 1 ainda não conjura',()=>{
  expect(limiteMagiasPorClasse2014(classe('Mago',5),'mago')?.maximo).toBe(8)
  expect(limiteMagiasPorClasse2014(classe('Clérigo',3),'clerigo')?.maximo).toBe(6)
  expect(limiteMagiasPorClasse2014(classe('Paladino',1),'paladino')?.maximo).toBe(0)
  expect(limiteMagiasPorClasse2014(classe('Paladino',2),'paladino')?.maximo).toBe(4)
 })
 it('respeita magias conhecidas de Bardo, Feiticeiro, Bruxo e Patrulheiro',()=>{
  expect(limiteMagiasPorClasse2014(classe('Bardo',1),'bardo')?.maximo).toBe(4)
  expect(limiteMagiasPorClasse2014(classe('Feiticeiro',20),'feiticeiro')?.maximo).toBe(15)
  expect(limiteMagiasPorClasse2014(classe('Bruxo',10),'bruxo')?.maximo).toBe(10)
  expect(limiteMagiasPorClasse2014(classe('Patrulheiro',2),'patrulheiro')?.maximo).toBe(2)
 })
 it('não deixa preparar acima do limite nem contornar usando modo incorreto',()=>{
  const d=classe('Mago',5)
  const ok={...d,dnd2014Magias:magias('mago','preparada',8)}
  const demais={...d,dnd2014Magias:magias('mago','preparada',9)}
  expect(validarAlteracoesMagias2014(d,ok,'phb2014')).toEqual([])
  expect(validarAlteracoesMagias2014(d,demais,'phb2014').some(x=>x.includes('preparadas'))).toBe(true)
  const bard=classe('Bardo',1)
  const over={...bard,dnd2014Magias:magias('bardo','conhecida',5)}
  expect(validarAlteracoesMagias2014(bard,over,'phb2014').some(x=>x.includes('conhecidas'))).toBe(true)
  expect(validarAlteracoesMagias2014(bard,{...bard,dnd2014Magias:magias('bardo','preparada',1)},'phb2014').length).toBeGreaterThan(0)
  expect(resumoPreparacaoMagias2014(d,ok.dnd2014Magias)[0].total).toBe(8)
 })
 it('truques, itens e magias do mestre não gastam as cotas de preparação',()=>{
  const d=classe('Mago',5)
  const extras=lerMagias2014([{nome:'Truque Teste',nivel:0,classe:'mago',fonte:'phb2014',modo:'conhecida'},
   ...Array.from({length:11},(_,i)=>({nome:'Bônus '+i,nivel:1,classe:'mago',fonte:'phb2014',modo:'extra'}))])
  expect(validarAlteracoesMagias2014(d,{...d,dnd2014Magias:extras},'phb2014')).toEqual([])
 })
})
