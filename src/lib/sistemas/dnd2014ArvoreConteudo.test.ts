import {describe,it,expect} from 'vitest'
import {sistemaPorId} from './catalogo'
import {fichaVazia,normalizarFicha} from './calculo'
import {tituloSistemaNaFicha,edicaoEfetivaDaFicha} from './edicaoFichaDnd'
import {hexagonosOficiaisDnd} from './arvoreDndOficial'
import {conteudoDetalheDnd} from './dndArvoreConteudo'
import {INIMIGOS_FAVORITOS_PDF_2014,validarInimigoFavorito2014} from './dnd2014PatrulheiroEscolhas'
import {categoria} from '../nuvem/categorias'
const sistema=sistemaPorId('dnd5e-srd')!
function ranger(){
 const d=fichaVazia(sistema)
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.campos={...d.campos,classe:'Patrulheiro',especie:'Tiferino',antecedente:'Forasteiro',nivel:1}
 return d
}

describe('Regressão edição correta da ficha e árvore',()=>{
 it('mostra a edição-base da ficha, não o rótulo genérico 2024 do catálogo',()=>{
   const d=ranger()
   expect(tituloSistemaNaFicha(sistema,d)).toContain('D&D 2014')
   expect(edicaoEfetivaDaFicha(sistema,d)).toBe('phb2014')
   d.dndLivros={base:'phb2024',suplementos:[]}
   expect(tituloSistemaNaFicha(sistema,d)).toContain('D&D 2024')
   expect(tituloSistemaNaFicha(sistema,d,'phb2014')).toContain('D&D 2014')
   expect(edicaoEfetivaDaFicha(sistema,d,'phb2014')).toBe('phb2014')
   const semLivro={...d,dndLivros:undefined}
   expect(tituloSistemaNaFicha(sistema,semLivro)).toContain('D&D 2024')
   expect(tituloSistemaNaFicha({id:'outro',nome:'Outro RPG'},d)).toBe('Outro RPG')
 })
 it('Árvore e cabeçalho respeitam a mesma edição sem mostrar características 2014 em 2024',()=>{
   const d=ranger()
   const antigos=hexagonosOficiaisDnd(d,'phb2014')
   expect(antigos.some(x=>x.titulo.startsWith('Inimigo Favorito'))).toBe(true)
   expect(antigos.some(x=>x.titulo==='Raça: Tiferino')).toBe(true)
   expect(antigos.some(x=>x.titulo==='Antecedente: Forasteiro')).toBe(true)
   const novos=hexagonosOficiaisDnd(d,'phb2024')
   expect(novos.some(x=>x.id.startsWith('2014-'))).toBe(false) // 2024 pode ter característica homônima, mas não o nó da edição legada
 })
 it('mostra dentro da ficha as explicações do Patrulheiro, Tiferino e Forasteiro',()=>{
   const d=ranger()
   d.dnd2014InimigoFavorito='Bestas';d.dnd2014IdiomaInimigo='Silvestre'
   d.dnd2014AntecedenteExtras={antecedente:'Forasteiro',ferramentas:['Flauta'],idiomas:['Élfico']}
   const lista=hexagonosOficiaisDnd(d,'phb2014')
   const pegar=(termo:string)=>conteudoDetalheDnd(d,lista.find(x=>x.titulo.includes(termo))!,'phb2014')
   const inimigo=pegar('Inimigo Favorito')
   expect(inimigo.beneficios.join(' ')).toContain('rastrear')
   expect(inimigo.registro).toContain('Bestas')
   expect(inimigo.registro).toContain('Silvestre')
   const explorar=pegar('Explorador Natural')
   expect(explorar.beneficios.join(' ')).toContain('iniciativa')
   const tiferino=pegar('Raça: Tiferino')
   expect(tiferino.beneficios.join(' ')).toContain('fogo')
   expect(tiferino.beneficios.join(' ')).toContain('Taumaturgia')
   const forasteiro=pegar('Antecedente: Forasteiro')
   expect(forasteiro.beneficios.join(' ')).toContain('Atletismo')
   expect(forasteiro.registro).toContain('Flauta')
   expect(forasteiro.registro).toContain('Élfico')
 })
 it('registra escolha do Patrulheiro sem converter 2014 para 2024 ou inventar bônus',()=>{
   const d=ranger()
   expect(INIMIGOS_FAVORITOS_PDF_2014).toContain('Bestas')
   const novo={...d,dnd2014InimigoFavorito:'Bestas',dnd2014IdiomaInimigo:'Silvestre'}
   expect(validarInimigoFavorito2014(d,novo,'phb2014')).toEqual([])
   expect(validarInimigoFavorito2014(d,novo,'phb2024')).toHaveLength(1)
   expect(validarInimigoFavorito2014(d,{...novo,dnd2014InimigoFavorito:'Dragões'},'phb2014')).toHaveLength(1)
   expect(normalizarFicha(sistema,novo).dnd2014InimigoFavorito).toBe('Bestas')
   expect(normalizarFicha(sistema,novo).dnd2014IdiomaInimigo).toBe('Silvestre')
   expect(categoria('dnd5e-srd','dnd2014InimigoFavorito')).toBe('habilidades')
   expect(categoria('dnd5e-srd','dnd2014IdiomaInimigo')).toBe('habilidades')
 })
})
