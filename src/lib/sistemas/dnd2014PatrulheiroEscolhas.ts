/** Escolhas do Patrulheiro apresentadas no PDF de 2014 enviado pelo usuário.
 * O PDF contém variantes do Patrulheiro diferentes de outras impressões 5e.
 * Por isso a seleção é registrada; bônus de dano e iniciativa dependem
 * da variante aprovada pelo mestre e nunca são concedidos silenciosamente.
 */
import type {DadosFicha} from './tipos'
import {classesDaFicha2014} from './dnd2014Multiclasse'

export const INIMIGOS_FAVORITOS_PDF_2014=[
  'Bestas','Fadas','Humanoides','Monstruosidades','Mortos-vivos',
] as const

export function nivelPatrulheiro2014(d:Pick<DadosFicha,'campos'|'dnd2014Multiclasse'>):number{
 return classesDaFicha2014(d).lista.find(x=>x.cls.id==='patrulheiro')?.nivel??0
}
export function validarInimigoFavorito2014(
 antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024'
):string[]{
 const mudou=antes.dnd2014InimigoFavorito!==depois.dnd2014InimigoFavorito ||
   antes.dnd2014IdiomaInimigo!==depois.dnd2014IdiomaInimigo
 if(!mudou && JSON.stringify(antes.campos)===JSON.stringify(depois.campos)&&
   JSON.stringify(antes.dnd2014Multiclasse??{})===JSON.stringify(depois.dnd2014Multiclasse??{}))return []
 if(edicao!=='phb2014')return mudou?['Inimigo Favorito do Patrulheiro 2014 não pode ser editado em ficha 2024.']:[]
 const inimigo=depois.dnd2014InimigoFavorito
 const idioma=depois.dnd2014IdiomaInimigo
 if(inimigo===undefined && idioma===undefined)return []
 if(nivelPatrulheiro2014(depois as DadosFicha)<1)
   return ['A escolha de Inimigo Favorito exige um Patrulheiro 2014 na ficha.']
 if(inimigo!==undefined && inimigo!=='' &&
   !INIMIGOS_FAVORITOS_PDF_2014.some(x=>x===inimigo))
   return ['Tipo de Inimigo Favorito inválido.']
 if(idioma!==undefined&&(typeof idioma!=='string'||idioma.length>80))
   return ['Idioma do Inimigo Favorito precisa ser um texto curto.']
 return []
}
