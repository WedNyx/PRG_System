import {describe,it,expect} from 'vitest'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
import {aplicarDescanso} from './descanso'
import {custoMetamagia2014,usarMetamagia2014} from './dnd2014OpcoesClasse'
const s=sistemaPorId('dnd5e-srd')!
function feiticeiro(nivel=5){
 const d=fichaVazia(s)
 d.campos={...d.campos,classe:'Feiticeiro',nivel}
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.dnd2014OpcoesClasse={metamagicas:['Magia Acelerada','Magia Duplicada']}
 d.recursos={...d.recursos,feiticaria:{atual:nivel}}
 return d
}
describe('Metamagia — gastos reais de pontos de Feitiçaria 2014',()=>{
 it('reproduz custos fixos e por círculo da magia do livro',()=>{
  expect(custoMetamagia2014('Magia Acelerada',4)).toBe(2)
  expect(custoMetamagia2014('Magia Aumentada',1)).toBe(3)
  expect(custoMetamagia2014('Magia Cuidadosa',3)).toBe(1)
  expect(custoMetamagia2014('Magia Distante',3)).toBe(1)
  expect(custoMetamagia2014('Magia Duplicada',0)).toBe(1)
  expect(custoMetamagia2014('Magia Duplicada',5)).toBe(5)
  expect(custoMetamagia2014('Magia Estendida',2)).toBe(1)
  expect(custoMetamagia2014('Magia Potencializada',2)).toBe(1)
  expect(custoMetamagia2014('Magia Sutil',2)).toBe(1)
  expect(custoMetamagia2014('Magia Inexistente',2)).toBeNull()
  expect(custoMetamagia2014('Magia Duplicada',10)).toBeNull()
 })
 it('desconta do recurso existente sem criar um segundo contador ou gastar slots',()=>{
  const antes=feiticeiro()
  const primeiro=usarMetamagia2014(antes,'Magia Acelerada',2)!
  expect(primeiro.custo).toBe(2)
  expect(primeiro.ficha.recursos.feiticaria.atual).toBe(3)
  expect(primeiro.ficha.recursos).toHaveProperty('feiticaria')
  expect(primeiro.ficha.dnd2014OpcoesClasse).toEqual(antes.dnd2014OpcoesClasse)
  expect(antes.recursos.feiticaria.atual).toBe(5)
  const segundo=usarMetamagia2014(primeiro.ficha,'Magia Duplicada',3)!
  expect(segundo.ficha.recursos.feiticaria.atual).toBe(0)
  expect(usarMetamagia2014(segundo.ficha,'Magia Acelerada',1)).toBeNull()
  expect(aplicarDescanso(s,segundo.ficha,'longo').d.recursos.feiticaria.atual).toBe(5)
 })
 it('Restauração Mística: Feiticeiro 20 recupera 4 PF por descanso curto, mas nível 19 não',()=>{
  const d=feiticeiro(20)
  d.recursos.feiticaria.atual=0
  const primeiro=aplicarDescanso(s,d,'curto').d
  expect(primeiro.recursos.feiticaria.atual).toBe(4)
  const segundo=aplicarDescanso(s,primeiro,'curto').d
  expect(segundo.recursos.feiticaria.atual).toBe(8)
  const jovem=feiticeiro(19)
  jovem.recursos.feiticaria.atual=0
  expect(aplicarDescanso(s,jovem,'curto').d.recursos.feiticaria.atual).toBe(0)
  expect(aplicarDescanso(s,jovem,'longo').d.recursos.feiticaria.atual).toBe(19)
 })
 it('não permite gastar opção não escolhida, nível não elegível ou custo maior que saldo',()=>{
  expect(usarMetamagia2014(feiticeiro(2),'Magia Acelerada',1)).toBeNull()
  expect(usarMetamagia2014(feiticeiro(),'Magia Aumentada',1)).toBeNull()
  expect(usarMetamagia2014(feiticeiro(),'Magia Duplicada',7)).toBeNull()
  const d=feiticeiro()
  d.recursos.feiticaria.atual=0
  expect(usarMetamagia2014(d,'Magia Acelerada',1)).toBeNull()
 })
})
