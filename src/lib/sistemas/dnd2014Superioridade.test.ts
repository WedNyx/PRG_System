import {describe,it,expect} from 'vitest'
import {fichaVazia,normalizarFicha} from './calculo'
import {sistemaPorId} from './catalogo'
import {aplicarDescanso} from './descanso'
import {dadosSuperioridade2014,gastarSuperioridade2014,validarSuperioridade2014} from './dnd2014Superioridade'
import {categoria} from '../nuvem/categorias'
const s=sistemaPorId('dnd5e-srd')!
function guerreiro(nivel:number){
 const d=fichaVazia(s)
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.campos={...d.campos,classe:'Guerreiro',nivel}
 d.dnd2014Subclasse='mestre-batalha'
 return d
}
describe('Mestre de Batalha — Dados de Superioridade (PHB 2014)',()=>{
 it('progride 4d8, 5d8, 5d10, 6d10 e 6d12 pela classe Guerreiro',()=>{
  expect(dadosSuperioridade2014(guerreiro(2))).toBeNull()
  expect(dadosSuperioridade2014(guerreiro(3))?.maximo).toBe(4)
  expect(dadosSuperioridade2014(guerreiro(7))?.maximo).toBe(5)
  expect(dadosSuperioridade2014(guerreiro(10))?.dado).toBe('d10')
  expect(dadosSuperioridade2014(guerreiro(15))?.maximo).toBe(6)
  expect(dadosSuperioridade2014(guerreiro(18))?.dado).toBe('d12')
 })
 it('gasta só dados restantes, persiste e recarrega nos dois descansos',()=>{
  const d=guerreiro(7)
  let atual=d
  for(let i=0;i<5;i++){
   const proximo=gastarSuperioridade2014(atual)
   expect(proximo).not.toBeNull()
   atual=proximo!
  }
  expect(dadosSuperioridade2014(atual)?.restantes).toBe(0)
  expect(gastarSuperioridade2014(atual)).toBeNull()
  expect(normalizarFicha(s,atual).dnd2014DadosSuperioridadeUsados).toBe(5)
  expect(validarSuperioridade2014(d,atual,'phb2014')).toEqual([])
  for(const descanso of ['curto','longo'] as const){
   const recuperado=aplicarDescanso(s,atual,descanso).d
   expect(dadosSuperioridade2014(recuperado)?.restantes).toBe(5)
  }
  expect(categoria('dnd5e-srd','dnd2014DadosSuperioridadeUsados')).toBe('pv')
 })
 it('não aceita excedentes, classes erradas ou editar no livro 2024',()=>{
  const d=guerreiro(3)
  expect(validarSuperioridade2014(d,{...d,dnd2014DadosSuperioridadeUsados:5},'phb2014').length).toBeGreaterThan(0)
  expect(validarSuperioridade2014(d,{...d,dnd2014DadosSuperioridadeUsados:-1},'phb2014').length).toBeGreaterThan(0)
  expect(validarSuperioridade2014(d,{...d,dnd2014DadosSuperioridadeUsados:1},'phb2024').length).toBeGreaterThan(0)
  expect(dadosSuperioridade2014({...d,dnd2014Subclasse:'campeao'})).toBeNull()
 })
 it('multiclasse baseia tamanho e quantidade no nível de Guerreiro, não no total',()=>{
  const d=guerreiro(14)
  d.campos.classe='Mago';d.dnd2014Subclasse='evocacao'
  d.dnd2014Multiclasse={guerreiro:3};d.dnd2014Subclasses={guerreiro:'mestre-batalha'}
  const sup=dadosSuperioridade2014(d)
  expect(sup?.nivelClasse).toBe(3)
  expect(sup?.maximo).toBe(4)
  expect(sup?.dado).toBe('d8')
 })
})
