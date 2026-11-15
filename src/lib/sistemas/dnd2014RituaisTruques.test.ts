import {describe,it,expect} from 'vitest'
import {limiteTruques2014} from './dnd2014PreparacaoMagias'
import {podeConjurarRitualMagia2014,lerMagias2014,validarAlteracoesMagias2014} from './dnd2014Magias'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
const s=sistemaPorId('dnd5e-srd')!
const base=()=>{
 const d=fichaVazia(s)
 d.campos={...d.campos,classe:'Mago',nivel:1}
 d.dndLivros={base:'phb2014',suplementos:[]}
 return d
}
describe('Etapa 3 — truques e rituais do Livro do Jogador 2014',()=>{
 it('aplica progressão de truques própria das classes e subclasses 2014',()=>{
  expect(limiteTruques2014('mago',1)).toBe(3)
  expect(limiteTruques2014('mago',4)).toBe(4)
  expect(limiteTruques2014('mago',10)).toBe(5)
  expect(limiteTruques2014('bardo',1)).toBe(2)
  expect(limiteTruques2014('clerigo',10)).toBe(5)
  expect(limiteTruques2014('feitiçeiro',1)).toBe(0)
  expect(limiteTruques2014('feiticeiro',1)).toBe(4)
  expect(limiteTruques2014('guerreiro',7,'campeao')).toBe(0)
  expect(limiteTruques2014('guerreiro',3,'cavaleiro-arcano')).toBe(2)
  expect(limiteTruques2014('ladino',10,'trapaceiro-arcano')).toBe(4)
  expect(limiteTruques2014('paladino',20)).toBe(0)
 })
 it('servidor barra quatro truques de Mago nível 1, mas permite três',()=>{
  const d=base()
  const criar=(quantos:number)=>lerMagias2014(Array.from({length:quantos},(_,i)=>({
   nome:'Truque '+i,nivel:0,classe:'mago',fonte:'phb2014',modo:'conhecida'
  })))
  expect(validarAlteracoesMagias2014(d,{...d,dnd2014Magias:criar(3)},'phb2014')).toEqual([])
  expect(validarAlteracoesMagias2014(d,{...d,dnd2014Magias:criar(4)},'phb2014')
    .some(x=>x.includes('truques conhecidos'))).toBe(true)
 })
 it('ritual sem espaço só onde a classe possui a característica e magia tem descritor ritual no livro',()=>{
  const magia=(classe:string,modo:'conhecida'|'preparada'|'extra'='conhecida')=>
   lerMagias2014([{nome:'Detectar Magia',nivel:1,classe,fonte:'phb2014',modo}])[0]
  expect(podeConjurarRitualMagia2014(magia('mago'))).toBe(true)
  expect(podeConjurarRitualMagia2014(magia('clerigo','preparada'))).toBe(true)
  expect(podeConjurarRitualMagia2014(magia('druida','preparada'))).toBe(true)
  expect(podeConjurarRitualMagia2014(magia('bardo'))).toBe(true)
  expect(podeConjurarRitualMagia2014(magia('paladino','preparada'))).toBe(false)
  expect(podeConjurarRitualMagia2014(magia('feiticeiro'))).toBe(false)
  expect(podeConjurarRitualMagia2014(magia('bruxo'))).toBe(false)
  expect(podeConjurarRitualMagia2014(magia('clerigo','extra'))).toBe(false)
  expect(podeConjurarRitualMagia2014({...magia('mago'),nome:'Bola de Fogo'})).toBe(false)
 })
})
