import {describe,it,expect} from 'vitest'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
import {hexagonosOficiaisDnd} from './arvoreDndOficial'
import {conteudoDetalheDnd} from './dndArvoreConteudo'
import {tituloSistemaNaFicha} from './edicaoFichaDnd'

const s=sistemaPorId('dnd5e-srd')!
function ficha(){
 const d=fichaVazia(s)
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.campos={...d.campos,classe:'Patrulheiro',nivel:1,especie:'Tiferino',antecedente:'Forasteiro'}
 d.dnd2014InimigoFavorito='Bestas'
 d.dnd2014IdiomaInimigo='Silvestre'
 d.dnd2014AntecedenteExtras={antecedente:'Forasteiro',ferramentas:['Flauta'],idiomas:['Élfico']}
 return d
}
describe('Árvore e cabeçalho exibem a edição e informações dentro da ficha',()=>{
 it('título da ficha segue o livro selecionado; campanha pode sobrescrever',()=>{
  const d=ficha()
  expect(tituloSistemaNaFicha(s,d)).toContain('2014')
  expect(tituloSistemaNaFicha(s,d)).not.toContain('2024')
  expect(tituloSistemaNaFicha(s,d,'phb2024')).toContain('2024')
  expect(tituloSistemaNaFicha(s,{...d,dndLivros:{base:'phb2024',suplementos:[]}})).toContain('2024')
 })
 it('no nível 1, usuário vê Inimigo Favorito e Explorador Natural com regras utilizáveis',()=>{
  const d=ficha(),nos=hexagonosOficiaisDnd(d,'phb2014')
  const inimigo=nos.find(n=>n.titulo.startsWith('Inimigo Favorito'))
  const explorador=nos.find(n=>n.titulo.startsWith('Explorador Natural'))
  expect(inimigo).toBeDefined()
  expect(explorador).toBeDefined()
  const detalhado=conteudoDetalheDnd(d,inimigo!,'phb2014')
  expect(detalhado.beneficios.length).toBeGreaterThanOrEqual(3)
  expect(detalhado.registro).toContain('Bestas')
  expect(detalhado.atencao).toContain('diferenças')
  expect(conteudoDetalheDnd(d,explorador!,'phb2014').beneficios.length).toBeGreaterThanOrEqual(3)
 })
 it('Tiferino e Forasteiro exibem traços, equipamento e escolhas registradas',()=>{
  const d=ficha(),nos=hexagonosOficiaisDnd(d,'phb2014')
  const r=nos.find(n=>n.id==='2014-raca')!
  const a=nos.find(n=>n.id==='2014-antecedente')!
  expect(r.descricao).toContain('Carisma')
  expect(a.descricao).toContain('Equipamento inicial')
  expect(conteudoDetalheDnd(d,r,'phb2014').beneficios.join(' ')).toContain('fogo')
  expect(conteudoDetalheDnd(d,a,'phb2014').registro).toContain('Flauta')
  expect(conteudoDetalheDnd(d,a,'phb2014').registro).toContain('Élfico')
 })
 it('livro 2024 nunca herda os cartões nem resumos de regras 2014',()=>{
  const d=ficha()
  const nos=hexagonosOficiaisDnd(d,'phb2024')
  expect(nos.some(n=>n.id.startsWith('2014-'))).toBe(false)
  const virtual={id:'teste2024',titulo:'Benefício 2024',descricao:'Regra da edição revisada',nivel:1,ramo:'classe' as const,estado:'referencia' as const,livro:'SRD 5.2.1'}
  const info=conteudoDetalheDnd(d,virtual,'phb2024')
  expect(info.resumo).toBe('Regra da edição revisada')
  expect(info.beneficios).toEqual([])
 })
})
