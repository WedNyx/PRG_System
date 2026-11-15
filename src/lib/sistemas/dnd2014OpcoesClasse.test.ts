import {describe,it,expect} from 'vitest'
import {fichaVazia,normalizarFicha} from './calculo'
import {sistemaPorId} from './catalogo'
import {limiteMetamagia2014,validarOpcoesClasseDnd2014,niveisConjuradores2014} from './dnd2014OpcoesClasse'
import {categoria} from '../nuvem/categorias'
const s=sistemaPorId('dnd5e-srd')!
function f(){
 const d=fichaVazia(s)
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.campos={...d.campos,classe:'Feiticeiro',nivel:10}
 return d
}
describe('Etapa 3 — Metamagia e Dádiva do Pacto',()=>{
 it('Feiticeiro começa com 2, recebe terceira no 10 e quarta no 17',()=>{
  expect(limiteMetamagia2014(1)).toBe(0)
  expect(limiteMetamagia2014(3)).toBe(2)
  expect(limiteMetamagia2014(10)).toBe(3)
  expect(limiteMetamagia2014(17)).toBe(4)
 })
 it('valida escolhas de metamagia e impede repetição ou níveis futuros',()=>{
  const d=f()
  const novo={...d,dnd2014OpcoesClasse:{metamagicas:['Magia Acelerada','Magia Sutil','Magia Distante']}}
  expect(validarOpcoesClasseDnd2014(d,novo,'phb2014')).toEqual([])
  expect(normalizarFicha(s,novo).dnd2014OpcoesClasse).toEqual(novo.dnd2014OpcoesClasse)
  expect(categoria('dnd5e-srd','dnd2014OpcoesClasse')).toBe('habilidades')
  expect(validarOpcoesClasseDnd2014(d,{...novo,dnd2014OpcoesClasse:{
   metamagicas:['Magia Acelerada','Magia Sutil','Magia Sutil']}},'phb2014')).toHaveLength(1)
  expect(validarOpcoesClasseDnd2014(d,{...novo,campos:{...d.campos,nivel:3}},'phb2014')).toHaveLength(1)
 })
 it('Dádiva do Pacto só após nível 3 de Bruxo, inclusive multiclasse',()=>{
  const d=f()
  d.campos.classe='Bruxo';d.campos.nivel=3
  const valido={...d,dnd2014OpcoesClasse:{pactoBruxo:'Pacto da Lâmina'}}
  expect(validarOpcoesClasseDnd2014(d,valido,'phb2014')).toEqual([])
  expect(validarOpcoesClasseDnd2014(d,{...valido,campos:{...d.campos,nivel:2}},'phb2014').length).toBeGreaterThan(0)
  expect(validarOpcoesClasseDnd2014(d,valido,'phb2024').length).toBeGreaterThan(0)
  d.campos.classe='Mago';d.campos.nivel=15;d.dnd2014Multiclasse={bruxo:2}
  expect(niveisConjuradores2014(d).bruxo).toBe(2)
  expect(validarOpcoesClasseDnd2014(d,{...d,dnd2014OpcoesClasse:{pactoBruxo:'Pacto do Tomo'}},'phb2014').length).toBeGreaterThan(0)
 })
})
