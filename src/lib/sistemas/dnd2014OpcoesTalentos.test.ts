import {describe,it,expect} from 'vitest'
import {fichaVazia,normalizarFicha} from './calculo'
import {sistemaPorId} from './catalogo'
import {atributosEfetivos2014,efeitosDnd2014} from './dnd2014Regras'
import {OPCOES_TALENTOS_2014,validarOpcoesTalentos2014} from './dnd2014OpcoesTalentos'
import {categoria} from '../nuvem/categorias'

const s=sistemaPorId('dnd5e-srd')!
function f(){
 const d=fichaVazia(s)
 d.campos={...d.campos,classe:'Mago',especie:'Humano',subraca2014:'Humano padrão',nivel:4}
 d.dnd2014AtributosBase={FOR:10,DES:12,CON:13,INT:15,SAB:13,CAR:8}
 d.dndLivros={base:'phb2014',suplementos:[]}
 return d
}
describe('Etapa 3 — opções de talentos e efeitos de atributos PHB 2014',()=>{
 it('atributo +1 só quando a opção foi explicitamente preenchida',()=>{
  const d=f(),antes=atributosEfetivos2014(d)!
  d.dnd2014Talentos=['ATLETA','RESILIENTE','MENTE AFIADA']
  const sem=atributosEfetivos2014(d)!
  expect(sem).toEqual(antes)
  d.dnd2014OpcoesTalentos={ATLETA:'DES',RESILIENTE:'SAB','MENTE AFIADA':'INT'}
  const depois=atributosEfetivos2014(d)!
  expect(depois.DES).toBe(antes.DES+1)
  expect(depois.SAB).toBe(antes.SAB+1)
  expect(depois.INT).toBe(antes.INT+1)
  expect(efeitosDnd2014(d,{}).treino.resist_sabedoria?.treino).toBe('proficiente')
  expect(normalizarFicha(s,d).dnd2014OpcoesTalentos).toEqual(d.dnd2014OpcoesTalentos)
 })
 it('não ultrapassa 20 em bônus de talento automático',()=>{
  const d=f()
  d.dnd2014AtributosBase!.FOR=19
  d.dnd2014Talentos=['RESILIENTE']
  d.dnd2014OpcoesTalentos={RESILIENTE:'FOR'}
  const a=atributosEfetivos2014(d)!
  expect(a.FOR).toBe(20)
 })
 it('servidor rejeita opção que não pertence ao talento ou à edição',()=>{
  const d=f()
  const certo={...d,dnd2014Talentos:['ATLETA'],dnd2014OpcoesTalentos:{ATLETA:'DES'}}
  expect(validarOpcoesTalentos2014(d,certo,'phb2014')).toEqual([])
  expect(categoria('dnd5e-srd','dnd2014OpcoesTalentos')).toBe('habilidades')
  expect(validarOpcoesTalentos2014(d,{...certo,dnd2014OpcoesTalentos:{ATLETA:'CAR'}},'phb2014').length).toBeGreaterThan(0)
  expect(validarOpcoesTalentos2014(d,{...certo,dnd2014Talentos:[]},'phb2014').length).toBeGreaterThan(0)
  expect(validarOpcoesTalentos2014(d,certo,'phb2024').length).toBeGreaterThan(0)
 })
 it('catálogo distingue escolhas de elemento, atributo e listas sem conceder bônus fictícios',()=>{
  expect(OPCOES_TALENTOS_2014['ADEPTO ELEMENTAL'].opcoes).toContain('Fogo')
  expect(OPCOES_TALENTOS_2014['CONJURADOR DE RITUAL'].opcoes).toContain('Druida')
  expect(OPCOES_TALENTOS_2014['INICIADO EM MAGIA'].bonusAtributo).toBeUndefined()
 })
})
