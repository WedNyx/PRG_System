import {describe,it,expect} from 'vitest'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
import {hexagonosOficiaisDnd} from './arvoreDndOficial'
const s=sistemaPorId('dnd5e-srd')!
describe('Árvore de Constelações — escolhas específicas do PHB 2014',()=>{
 it('Mestre de Batalha registra manobras, sem inventar poderes automáticos',()=>{
  const d=fichaVazia(s)
  d.dndLivros={base:'phb2014',suplementos:[]}
  d.campos={...d.campos,classe:'Guerreiro',nivel:3}
  d.dnd2014Subclasse='mestre-batalha'
  d.dnd2014EscolhasSubclasse={guerreiro:{subclasse:'mestre-batalha',grupos:{
    'manobras-3':['Aparar','Ataque de Precisão'],
  }}}
  const nos=hexagonosOficiaisDnd(d,'phb2014')
  expect(nos.some(x=>x.titulo==='Aparar'&&x.estado==='referencia')).toBe(true)
  expect(nos.some(x=>x.titulo==='Ataque de Precisão'&&x.estado==='referencia')).toBe(true)
  expect(nos.some(x=>x.titulo==='Passo Evasivo')).toBe(false)
  expect(nos.filter(x=>x.id.startsWith('2014-escolha-sub-'))).toHaveLength(2)
  expect(nos.every(x=>x.estado!=='recebido'||!x.id.startsWith('2014-escolha-sub-'))).toBe(true)
 })
 it('Bruxo e Feiticeiro apresentam escolhas somente como referências 2014',()=>{
  const d=fichaVazia(s)
  d.campos={...d.campos,classe:'Bruxo',nivel:6}
  d.dnd2014Multiclasse={feiticeiro:3}
  d.dnd2014OpcoesClasse={pactoBruxo:'Pacto do Tomo',metamagicas:['Magia Sutil']}
  d.dnd2014Talentos=['RESILIENTE']
  d.dnd2014OpcoesTalentos={RESILIENTE:'CON'}
  const arvore=hexagonosOficiaisDnd(d,'phb2014')
  expect(arvore.some(x=>x.id==='2014-pacto-bruxo'&&x.titulo==='Pacto do Tomo')).toBe(true)
  expect(arvore.some(x=>x.titulo==='Magia Sutil')).toBe(true)
  expect(arvore.find(x=>x.titulo==='Talento: RESILIENTE')?.descricao).toContain('CON')
  const nova=hexagonosOficiaisDnd(d,'phb2024')
  expect(nova.some(x=>x.id==='2014-pacto-bruxo'||x.id.startsWith('2014-metamagia'))).toBe(false)
 })
})
