import {describe,it,expect} from 'vitest'
import {SUBCLASSES_DND_2014,MARCOS_SUBCLASSES_COMERCIAIS_2014} from './dnd2014Subclasses'
import {hexagonosOficiaisDnd} from './arvoreDndOficial'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
describe('Etapa 3 — marcos de subclasses e árvore de talentos 2014',()=>{
 it('todas subclasses comerciais possuem os marcos de sua classe, não efeitos inventados',()=>{
  for(const x of SUBCLASSES_DND_2014.filter(x=>x.fonte==='phb2014')){
   expect(x.marcos?.map(y=>y.nivel)).toEqual(MARCOS_SUBCLASSES_COMERCIAIS_2014[x.classe])
   expect(x.marcos?.every(y=>y.nome.includes('conferir no PHB 2014'))).toBe(true)
  }
 })
 it('projeta talentos e grimório sem dar bônus automáticos ao personagem',()=>{
  const d=fichaVazia(sistemaPorId('dnd5e-srd')!)
  d.campos={...d.campos,classe:'Mago',nivel:6}
  d.dnd2014Subclasse='abjuracao'
  d.dnd2014Talentos=['ALERTA']
  d.dnd2014Magias=[{id:'a',nome:'Mísseis Mágicos',nivel:1,classe:'mago',fonte:'phb2014',modo:'preparada'}]
  const cards=hexagonosOficiaisDnd(d,'phb2014')
  expect(cards.some(x=>x.titulo==='Talento: ALERTA'&&x.estado==='referencia')).toBe(true)
  expect(cards.some(x=>x.id==='2014-grimorio'&&x.titulo.includes('1 magia'))).toBe(true)
  expect(cards.some(x=>x.titulo.includes('Escola de Abjuração')&&x.livro.includes('2014'))).toBe(true)
 })
})
