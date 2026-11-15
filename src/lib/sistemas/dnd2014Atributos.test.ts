import { describe,it,expect } from 'vitest'
import { diagnosticoAtributos2014, marcosIncremento2014, rolarAtributos2014, totalRolagem2014 } from './dnd2014Atributos'
import { atributosEfetivos2014, validarAlteracoes2014 } from './dnd2014Regras'
import { calcular, fichaVazia, normalizarFicha } from './calculo'
import { sistemaPorId } from './catalogo'
import { avaliarProntidaoDnd } from './dndProntidao'
const sistema=sistemaPorId('dnd5e-srd')!
function ficha() {
 const d=fichaVazia(sistema)
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.campos={...d.campos,classe:'Guerreiro',nivel:4,especie:'Humano',subraca2014:'Humano padrão'}
 d.dnd2014AtributosBase={FOR:15,DES:14,CON:13,INT:12,SAB:10,CAR:8}
 return d
}
describe('Criação e incrementos PHB 2014',()=>{
 it('verifica a permutação do conjunto padrão e a compra antes dos bônus raciais',()=>{
  const d={...ficha(),dnd2014MetodoAtributos:'padrao' as const}
  expect(diagnosticoAtributos2014(d)).toEqual([])
  expect(diagnosticoAtributos2014({...d,dnd2014AtributosBase:{...d.dnd2014AtributosBase,FOR:14}})).not.toEqual([])
  expect(diagnosticoAtributos2014({...d,dnd2014MetodoAtributos:'pontos'})).toEqual([])
  const excesso={...d,dnd2014MetodoAtributos:'pontos' as const,dnd2014AtributosBase:{FOR:15,DES:15,CON:15,INT:15,SAB:15,CAR:15}}
  expect(validarAlteracoes2014(d,excesso,'phb2014')).not.toEqual([])
  const incompleta={...d,dnd2014MetodoAtributos:'pontos' as const,dnd2014AtributosBase:{FOR:8,DES:8,CON:8,INT:8,SAB:8,CAR:8}}
  expect(validarAlteracoes2014(d,incompleta,'phb2014')).toEqual([])
  expect(avaliarProntidaoDnd(incompleta).pendencias.some(p=>p.id.startsWith('metodoAtributos2014'))).toBe(true)
 })
 it('registra 24 dados e permite redistribuir os seis totais, sem aceitar dados inválidos',()=>{
  const r=rolarAtributos2014(()=>0)
  expect(r).toHaveLength(6);expect(r.map(totalRolagem2014)).toEqual([3,3,3,3,3,3])
  expect(totalRolagem2014([6,2,5,4])).toBe(15)
  const d=ficha()
  expect(validarAlteracoes2014(d,{...d,dnd2014RolagensAtributos:[[9,1,2,3]]},'phb2014')).not.toEqual([])
  expect(diagnosticoAtributos2014({...d,dnd2014MetodoAtributos:'rolagem',dnd2014RolagensAtributos:r})).not.toEqual([])
 })
 it('usa nível da classe para os incrementos, incluindo Guerreiro e Ladino',()=>{
  const d=ficha()
  expect(marcosIncremento2014({...d,campos:{...d.campos,nivel:20}})).toHaveLength(7)
  expect(marcosIncremento2014({...d,campos:{...d.campos,classe:'Ladino',nivel:20}})).toHaveLength(6)
  expect(marcosIncremento2014({...d,campos:{...d.campos,nivel:8},dnd2014Multiclasse:{mago:4}}).map(m=>m.id)).toEqual(['guerreiro:4','mago:4'])
 })
 it('aplica pontos uma vez, preserva após serialização e atualiza CON nos PV',()=>{
  const d={...ficha(),dnd2014Incrementos:{'guerreiro:4':{atributos:['CON','CON']}}}
  expect(atributosEfetivos2014(d)?.CON).toBe(16)
  const reaberta=normalizarFicha(sistema,JSON.parse(JSON.stringify(d)))
  expect(reaberta.dnd2014Incrementos).toEqual(d.dnd2014Incrementos)
  expect(atributosEfetivos2014(reaberta)).toEqual(atributosEfetivos2014(d))
  expect(calcular(sistema,reaberta).derivados.pv_sugerido).toBe(40)
 })
 it('não duplica talento e incremento, nem concede marco futuro ou excede 20',()=>{
  const d=ficha(), inc={...d,dnd2014Incrementos:{'guerreiro:4':{atributos:['FOR','FOR']}}}
  expect(validarAlteracoes2014(d,inc,'phb2014')).toEqual([])
  expect(validarAlteracoes2014(d,{...inc,dnd2014Talentos:['ALERTA']},'phb2014')).not.toEqual([])
  expect(validarAlteracoes2014(d,{...inc,dnd2014Incrementos:{'guerreiro:6':{atributos:['FOR','FOR']}}},'phb2014')).not.toEqual([])
  expect(validarAlteracoes2014(d,{...inc,dnd2014AtributosBase:{...d.dnd2014AtributosBase,FOR:18}},'phb2014')).not.toEqual([])
  expect(validarAlteracoes2014(d,inc,'phb2024')).not.toEqual([])
 })
 it('Bárbaro 20 aplica Campeão Primitivo depois dos incrementos, até 24',()=>{
  const d={...ficha(),campos:{...ficha().campos,classe:'Bárbaro',nivel:20},
    dnd2014AtributosBase:{...ficha().dnd2014AtributosBase,FOR:17,CON:17},
    dnd2014Incrementos:{'barbaro:4':{atributos:['FOR','FOR']},'barbaro:8':{atributos:['CON','CON']}}}
  expect(atributosEfetivos2014(d)?.FOR).toBe(24)
  expect(atributosEfetivos2014(d)?.CON).toBe(24)
 })
 it('preserva totais manuais e rejeita pontos automáticos sem base',()=>{
  const d={...ficha(),dnd2014AtributosBase:undefined}
  expect(atributosEfetivos2014(d)).toBeNull()
  expect(validarAlteracoes2014(d,{...d,dnd2014Incrementos:{'guerreiro:4':{atributos:['FOR','FOR']}}},'phb2014')).not.toEqual([])
 })
})
