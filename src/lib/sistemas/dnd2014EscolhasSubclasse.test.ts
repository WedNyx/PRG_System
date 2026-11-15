import {describe,it,expect} from 'vitest'
import {ESCOLHAS_SUBCLASSES_2014,gruposSubclasseDaFicha2014,validarEscolhasSubclasses2014} from './dnd2014EscolhasSubclasse'
import {fichaVazia,normalizarFicha} from './calculo'
import {sistemaPorId} from './catalogo'
import {categoria} from '../nuvem/categorias'
const s=sistemaPorId('dnd5e-srd')!
function f(){
 const d=fichaVazia(s)
 d.campos={...d.campos,classe:'Guerreiro',nivel:7}
 d.dnd2014Subclasse='mestre-batalha'
 d.dndLivros={base:'phb2014',suplementos:[]}
 return d
}
describe('Escolhas internas de subclasses D&D 2014',()=>{
 it('valida somente grupos adquiridos pelo nível DA CLASSE',()=>{
  const d=f()
  const base=gruposSubclasseDaFicha2014(d,'guerreiro')
  expect(base.map(x=>x.id)).toEqual(['manobras-3','manobras-7'])
  expect(base[0].quantidade).toBe(3)
  expect(ESCOLHAS_SUBCLASSES_2014['guerreiro-totem']).toHaveLength(3)
  expect(ESCOLHAS_SUBCLASSES_2014['terra'][0].opcoes).toHaveLength(8)
 })
 it('salva grupos válidos e não aceita manobras duplicadas entre níveis',()=>{
  const d=f()
  const choose={...d,dnd2014EscolhasSubclasse:{guerreiro:{subclasse:'mestre-batalha',grupos:{
    'manobras-3':['Aparar','Derrubar','Contra-Atacar'],'manobras-7':['Inspirar','Ataque de Finta'],
  }}}}
  expect(validarEscolhasSubclasses2014(d,choose,'phb2014')).toEqual([])
  expect(normalizarFicha(s,choose).dnd2014EscolhasSubclasse).toEqual(choose.dnd2014EscolhasSubclasse)
  expect(categoria('dnd5e-srd','dnd2014EscolhasSubclasse')).toBe('habilidades')
  const invalida={...choose,dnd2014EscolhasSubclasse:{guerreiro:{
    ...choose.dnd2014EscolhasSubclasse.guerreiro,
    grupos:{...choose.dnd2014EscolhasSubclasse.guerreiro.grupos,
      'manobras-7':['Aparar','Ataque de Finta']},
  }}}
  expect(validarEscolhasSubclasses2014(d,invalida,'phb2014').some(x=>x.includes('repetida'))).toBe(true)
 })
 it('não aceita escolher talentos de classe futura nem mudar subclasses 2024',()=>{
  const d=f()
  const escolha={...d,dnd2014EscolhasSubclasse:{guerreiro:{subclasse:'mestre-batalha',
   grupos:{'manobras-15':['Aparar']}}}}
  expect(validarEscolhasSubclasses2014(d,escolha,'phb2014').length).toBeGreaterThan(0)
  expect(validarEscolhasSubclasses2014(d,escolha,'phb2024').length).toBeGreaterThan(0)
 })
 it('múltiplas classes usam suas próprias escolhas sem misturar níveis',()=>{
  const d=f()
  d.campos.nivel=9;d.dnd2014Multiclasse={druida:2};d.dnd2014Subclasses={druida:'terra'}
  const druid=gruposSubclasseDaFicha2014(d,'druida')
  expect(druid[0].id).toBe('terreno')
  expect(druid.length).toBe(1)
 })
})
