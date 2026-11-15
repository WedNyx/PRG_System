/** Magias do Círculo da Terra, D&D 5e 2014, capítulo Druida.
 * Metadados de níveis e nomes (não descrições/efeitos comerciais).
 * Estas magias ficam sempre preparadas e não contam na cota diária.
 */
import type {DadosFicha} from './tipos'
import {classesDaFicha2014} from './dnd2014Multiclasse'
import {subclasseDaFicha2014} from './dnd2014Subclasses'
export const MAGIAS_CIRCULO_TERRA_2014:Record<string,readonly [number,string,string][]>={
 'Ártico':[[3,'Imobilizar Pessoa','Crescer Espinho'],[5,'Nevasca','Lentidão'],
   [7,'Movimentação Livre','Tempestade de Gelo'],[9,'Comunhão com a Natureza','Cone de Frio']],
 'Costa':[[3,'Passo Nebuloso','Reflexos'],[5,'Andar na Água','Respirar Água'],
   [7,'Movimentação Livre','Controlar Água'],[9,'Vidência','Conjurar Elemental']],
 'Deserto':[[3,'Nublar','Silêncio'],[5,'Criar Alimentos','Proteção Contra Energia'],
   [7,'Praga','Terreno Alucinógeno'],[9,'Muralha de Pedra','Praga de Insetos']],
 'Floresta':[[3,'Patas de Aranha','Pele de Árvore'],[5,'Convocar Relâmpagos','Crescer Plantas'],
   [7,'Adivinhação','Movimentação Livre'],[9,'Comunhão com a Natureza','Passo de Árvore']],
 'Montanha':[[3,'Crescer Espinho','Patas de Aranha'],[5,'Mesclar-se às Rochas','Relâmpago'],
   [7,'Moldar Rochas','Pele de Pedra'],[9,'Criar Passagem','Muralha de Pedra']],
 'Pântano':[[3,'Escuridão','Flecha Ácida'],[5,'Andar na Água','Névoa Fétida'],
   [7,'Localizar Criatura','Movimentação Livre'],[9,'Vidência','Praga de Insetos']],
 'Planície':[[3,'Invisibilidade','Passos sem Pegadas'],[5,'Luz do Dia','Velocidade'],
   [7,'Adivinhação','Movimentação Livre'],[9,'Praga de Insetos','Sonho']],
 'Subterrâneo':[[3,'Patas de Aranha','Teia'],[5,'Forma Gasosa','Névoa Fétida'],
   [7,'Invisibilidade Maior','Moldar Rochas'],[9,'Praga de Insetos','Névoa Mortal']],
}
export function magiasCirculoTerra2014(d:DadosFicha):{nivelClasse:number;nivelMagia:number;nome:string}[]{
 const druida=classesDaFicha2014(d).lista.find(x=>x.cls.id==='druida')
 if(!druida||subclasseDaFicha2014(d,'druida')?.id!=='terra')return []
 const escolhas=d.dnd2014EscolhasSubclasse?.druida
 if(escolhas?.subclasse!=='terra')return []
 const terreno=escolhas.grupos.terreno?.[0]
 const lista=MAGIAS_CIRCULO_TERRA_2014[terreno??'']??[]
 return lista.filter(x=>druida.nivel>=x[0]).flatMap(([nivelClasse,a,b])=>[
   {nivelClasse,nivelMagia:nivelClasse===3?2:nivelClasse===5?3:nivelClasse===7?4:5,nome:a},
   {nivelClasse,nivelMagia:nivelClasse===3?2:nivelClasse===5?3:nivelClasse===7?4:5,nome:b},
 ])
}
