import {describe,it,expect} from 'vitest'
import {fichaVazia,normalizarFicha} from './calculo'
import {sistemaPorId} from './catalogo'
import {lerMagias2014} from './dnd2014Magias'
import {cdConcentracaoDano2014,iniciarConcentracao2014,encerrarConcentracao2014,validarConcentracao2014} from './dnd2014Concentracao'
const s=sistemaPorId('dnd5e-srd')!
describe('Etapa 3 — concentração em uma magia PHB 2014',()=>{
 it('CD 10 ou metade do dano, o maior; arredonda para baixo',()=>{
  expect(cdConcentracaoDano2014(1)).toBe(10)
  expect(cdConcentracaoDano2014(20)).toBe(10)
  expect(cdConcentracaoDano2014(21)).toBe(10)
  expect(cdConcentracaoDano2014(23)).toBe(11)
  expect(cdConcentracaoDano2014(40)).toBe(20)
 })
 it('mantém no máximo uma concentração e não ativa magia não marcada',()=>{
  const d=fichaVazia(s)
  d.campos={...d.campos,classe:'Druida',nivel:5}
  d.dndLivros={base:'phb2014',suplementos:[]}
  d.dnd2014Magias=lerMagias2014([
   {nome:'Concentração A',nivel:1,classe:'druida',fonte:'phb2014',modo:'preparada',concentracao:true},
   {nome:'Concentração B',nivel:1,classe:'druida',fonte:'phb2014',modo:'preparada',concentracao:true},
   {nome:'Instantânea',nivel:1,classe:'druida',fonte:'phb2014',modo:'preparada'},
  ])
  const primeiro=iniciarConcentracao2014(d,d.dnd2014Magias[0].id)
  expect(primeiro.dnd2014Concentracao?.nome).toBe('Concentração A')
  expect(iniciarConcentracao2014(primeiro,d.dnd2014Magias[2].id)).toEqual(primeiro)
  const segundo=iniciarConcentracao2014(primeiro,d.dnd2014Magias[1].id)
  expect(segundo.dnd2014Concentracao?.nome).toBe('Concentração B')
  expect(validarConcentracao2014(d,segundo,'phb2014')).toEqual([])
  expect(normalizarFicha(s,segundo).dnd2014Concentracao).toEqual(segundo.dnd2014Concentracao)
  expect(encerrarConcentracao2014(segundo).dnd2014Concentracao).toBeUndefined()
  expect(validarConcentracao2014(d,segundo,'phb2024').length).toBeGreaterThan(0)
 })
 it('não aceita concentração com magia removida, inexistente ou sem flag',()=>{
  const d=fichaVazia(s)
  const outro={...d,dnd2014Concentracao:{magiaId:'falsa',nome:'Falsa'}}
  expect(validarConcentracao2014(d,outro,'phb2014').length).toBeGreaterThan(0)
 })
})
