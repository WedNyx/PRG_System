import {describe, expect, it} from 'vitest'
import {aplicarDescanso} from './descanso'
import {calcular, fichaVazia, normalizarFicha} from './calculo'
import {sistemaPorId} from './catalogo'
import {esquemaFichaPorLivro} from './dnd2014Criacao'
const base=sistemaPorId('dnd5e-srd')!
function ficha(classe:string,nivel:number,outras:Record<string,number>={}) {
 const d=fichaVazia(base,'Aventureiro')
 d.dndLivros={base:'phb2014',suplementos:[]}
 d.campos={...d.campos,classe,nivel,especie:'Humano',subraca2014:'Humano padrão',antecedente:'Soldado'}
 d.atributos={...d.atributos,CAR:16}
 d.dnd2014Multiclasse=outras
 return d
}
const sistema=(d:ReturnType<typeof ficha>)=>esquemaFichaPorLivro(base,d)
describe('Descanso de D&D 2014 sem usar recargas de 2024',()=>{
 it('curto recupera Pacto, Surto, Retomar, Ki e Canalizar, mas não PV ou espaços comuns',()=>{
   const d=ficha('Guerreiro',8,{bruxo:3})
   d.recursos={...d.recursos,pv:{atual:5},pv_temp:{atual:3},dados_vida:{atual:4},
     retomar_folego:{atual:0},surto_acao:{atual:0},pacto:{atual:0},espacos_1:{atual:0}}
   const r=aplicarDescanso(sistema(d),d,'curto')
   expect(r.d.recursos.retomar_folego.atual).toBe(1)
   expect(r.d.recursos.surto_acao.atual).toBe(1)
   expect(r.d.recursos.pacto.atual).toBe(2)
   expect(r.d.recursos.espacos_1.atual).toBe(0)
   expect(r.d.recursos.pv.atual).toBe(5)
   expect(r.d.recursos.pv_temp.atual).toBe(3)
   expect(r.d.recursos.dados_vida.atual).toBe(4)
 })
 it('curto não devolve inspiração de Bardo antes do 5º nível, mas devolve a partir dele',()=>{
   const b4=ficha('Bardo',4), b5=ficha('Bardo',5)
   b4.recursos={...b4.recursos,inspiracao_bardo:{atual:0}}
   b5.recursos={...b5.recursos,inspiracao_bardo:{atual:0}}
   expect(calcular(sistema(b4),b4).recursosMax.inspiracao_bardo).toBeGreaterThan(0)
   expect(aplicarDescanso(sistema(b4),b4,'curto').d.recursos.inspiracao_bardo.atual).toBe(0)
   expect(aplicarDescanso(sistema(b5),b5,'curto').d.recursos.inspiracao_bardo.atual).toBeGreaterThan(0)
 })
 it('longo recupera apenas metade dos Dados de Vida gastos, sem reduzir exaustão de 2014 automaticamente',()=>{
   const d=ficha('Guerreiro',7)
   d.recursos={...d.recursos,dados_vida:{atual:0},pv:{atual:2},
     pv_temp:{atual:7},exaustao:{atual:3},surto_acao:{atual:0}}
   const first=aplicarDescanso(sistema(d),d,'longo').d
   expect(first.recursos.dados_vida.atual).toBe(3)
   expect(first.recursos.pv.atual).toBe(calcular(sistema(d),d).recursosMax.pv)
   expect(first.recursos.pv_temp.atual).toBe(0)
   expect(first.recursos.exaustao.atual).toBe(3)
   const second=aplicarDescanso(sistema(d),first,'longo').d
   expect(second.recursos.dados_vida.atual).toBe(6)
   expect(aplicarDescanso(sistema(d),second,'longo').d.recursos.dados_vida.atual).toBe(7)
 })
 it('curto exige e desconta Dados de Vida para recuperar PV em 2014',()=>{
   const d=ficha('Guerreiro',4)
   d.recursos={...d.recursos,pv:{atual:5},dados_vida:{atual:3},surto_acao:{atual:0}}
   expect(()=>aplicarDescanso(sistema(d),d,'curto',{cura:5})).toThrow('Dados de Vida')
   expect(()=>aplicarDescanso(sistema(d),d,'curto',{cura:5,dadosVidaGastos:4})).toThrow('Dados de Vida')
   const r=aplicarDescanso(sistema(d),d,'curto',{cura:5,dadosVidaGastos:2}).d
   expect(r.recursos.pv.atual).toBe(10)
   expect(r.recursos.dados_vida.atual).toBe(1)
   expect(r.recursos.surto_acao.atual).toBe(1)
   // A ficha original não é mutada enquanto se aplica o descanso.
   expect(d.recursos.dados_vida.atual).toBe(3)
 })
 it('2024 continua com descanso anterior, não aplica recuperação parcial de Dados de Vida legados',()=>{
   const d=fichaVazia(base,'Aventureiro')
   d.campos.nivel=7
   d.dndLivros={base:'phb2024',suplementos:[]}
   d.recursos={...d.recursos,dados_vida:{atual:0}}
   const r=aplicarDescanso(base,d,'longo')
   expect(r.d.recursos.dados_vida.atual).toBe(7)
 })
 it('descanso preserva edição, multiclasse, magias e anotações em ida e volta JSON',()=>{
   const d=ficha('Bruxo',4,{mago:2})
   d.dnd2014Magias=[{id:'raio-de-bruxa-1-bruxo',nome:'Raio de Bruxa',nivel:1,
     classe:'bruxo',fonte:'phb2014',modo:'conhecida'}]
   d.listas={...d.listas,tracos:'Uma promessa para o patrono'}
   const original=JSON.stringify(d)
   const r=aplicarDescanso(sistema(d),d,'curto')
   const salvo=normalizarFicha(sistema(d),JSON.parse(JSON.stringify(r.d)))
   expect(salvo.dndLivros?.base).toBe('phb2014')
   expect(salvo.dnd2014Multiclasse).toEqual({mago:2})
   expect(salvo.dnd2014Magias).toEqual(d.dnd2014Magias)
   expect(salvo.listas.tracos).toBe('Uma promessa para o patrono')
   expect(JSON.stringify(d)).toBe(original)
 })
})
