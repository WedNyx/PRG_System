import {describe,it,expect} from 'vitest'
import {avaliarRequisitoTalento2014,REQUISITOS_TALENTOS_2014,validarTalentos2014} from './dnd2014Talentos'
import {validarAlteracoes2014} from './dnd2014Regras'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
const s=sistemaPorId('dnd5e-srd')!
function base(nivel=4) {
 const d=fichaVazia(s)
 d.campos={...d.campos,classe:'Mago',nivel,especie:'Humano',subraca2014:'Humano padrão'}
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.atributos={...d.atributos,DES:12,INT:14,SAB:14}
 return d
}
describe('Etapa 3 — pré-requisitos de talentos PHB 2014',()=>{
 it('cobre exigências objetivas sem supor proficiências ausentes',()=>{
  expect(Object.keys(REQUISITOS_TALENTOS_2014).length).toBeGreaterThanOrEqual(10)
  expect(avaliarRequisitoTalento2014('DUELISTA DEFENSIVO',{atributos:{DES:12}}).estado).toBe('inapto')
  expect(avaliarRequisitoTalento2014('DUELISTA DEFENSIVO',{atributos:{DES:13}}).estado).toBe('apto')
  expect(avaliarRequisitoTalento2014('CONJURADOR DE RITUAL',{atributos:{INT:12,SAB:14}}).estado).toBe('apto')
  expect(avaliarRequisitoTalento2014('CONJURADOR DE RITUAL',{atributos:{INT:12,SAB:12}}).estado).toBe('inapto')
  expect(avaliarRequisitoTalento2014('PROTEÇÃO PESADA',{atributos:{FOR:20}}).estado).toBe('conferir')
  expect(avaliarRequisitoTalento2014('CONJURADOR DE GUERRA',{conjurador:false}).estado).toBe('conferir')
 })
 it('servidor bloqueia talento recém-escolhido sem Destreza 13',()=>{
  const d=base(),depois={...d,dnd2014Talentos:['DUELISTA DEFENSIVO']}
  expect(validarAlteracoes2014(d,depois,'phb2014').some(x=>x.includes('DES 13'))).toBe(true)
  depois.atributos={...depois.atributos,DES:13}
  expect(validarAlteracoes2014(d,depois,'phb2014')).toEqual([])
 })
 it('talento e incremento não podem ocupar o mesmo único marco de classe',()=>{
  const d=base()
  const depois={...d,dnd2014Incrementos:{'mago:4':{atributos:['DES','DES']}},dnd2014Talentos:['ALERTA']}
  expect(validarTalentos2014(d,depois,'phb2014').length).toBeGreaterThan(0)
  expect(validarAlteracoes2014(d,depois,'phb2014').length).toBeGreaterThan(0)
  expect(validarTalentos2014(d,{...d,dnd2014Talentos:['ALERTA']},'phb2014')).toEqual([])
 })
})
