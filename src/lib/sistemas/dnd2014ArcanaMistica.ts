/** Arcana Mística do Bruxo, PHB 2014, capítulo 3 (Bruxo).
 * Uma magia de cada círculo 6/7/8/9 ao alcançar níveis 11/13/15/17
 * da classe Bruxo. Cada uma pode ser conjurada 1 vez sem espaço
 * e só é recuperada após descanso longo.
 */
import type {DadosFicha} from './tipos'
import {classesDaFicha2014} from './dnd2014Multiclasse'
import {magiaReferenciada2014} from './dnd2014CatalogoMagias'

export const NIVEL_ARCANA_MISTICA_2014:Readonly<Record<number,number>>={6:11,7:13,8:15,9:17}
export function nivelBruxoArcana2014(d:Pick<DadosFicha,'campos'|'dnd2014Multiclasse'>):number{
 return classesDaFicha2014(d).lista.find(x=>x.cls.id==='bruxo')?.nivel??0
}
export function conjurarArcanaMistica2014(d:DadosFicha,id:string):DadosFicha|null{
 const magia=d.dnd2014Magias?.find(m=>m.id===id&&m.arcanaMistica===true)
 if(!magia||magia.classe!=='bruxo'||magia.modo!=='extra')return null
 const min=NIVEL_ARCANA_MISTICA_2014[magia.nivel]
 if(!min||nivelBruxoArcana2014(d)<min||d.dnd2014ArcanasUsadas?.includes(magia.nivel))return null
 return {...d,dnd2014ArcanasUsadas:[...new Set([...(d.dnd2014ArcanasUsadas??[]),magia.nivel])].sort((a,b)=>a-b),
   ...(magia.concentracao?{dnd2014Concentracao:{magiaId:magia.id,nome:magia.nome}}:{})}
}
export function validarArcanasMisticas2014(
 antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024'
):string[]{
 const a=JSON.stringify(antes.dnd2014ArcanasUsadas??[])
 const b=JSON.stringify(depois.dnd2014ArcanasUsadas??[])
 const c=JSON.stringify(antes.dnd2014Magias??[])
 const e=JSON.stringify(depois.dnd2014Magias??[])
 if(a===b&&c===e&&JSON.stringify(antes.dnd2014Multiclasse??{})===JSON.stringify(depois.dnd2014Multiclasse??{})&&
   antes.campos?.classe===depois.campos?.classe&&antes.campos?.nivel===depois.campos?.nivel)return []
 if(edicao!=='phb2014')return a===b&&c===e?[]:['Arcana Mística de 2014 não pode ser editada em 2024.']
 const d=depois as DadosFicha
 const usadas=d.dnd2014ArcanasUsadas??[]
 if(!Array.isArray(usadas)||usadas.length>4||usadas.some(x=>!Number.isInteger(x)||!NIVEL_ARCANA_MISTICA_2014[x])||
   new Set(usadas).size!==usadas.length)return ['Usos de Arcana Mística inválidos.']
 const nivel=nivelBruxoArcana2014(d)
 const marcadas=d.dnd2014Magias?.filter(x=>x.arcanaMistica)??[]
 const erros:string[]=[]
 const vistos=new Set<number>()
 for(const magia of marcadas){
  const minimo=NIVEL_ARCANA_MISTICA_2014[magia.nivel]
  if(!minimo||nivel<minimo||magia.classe!=='bruxo'||magia.modo!=='extra'||
     magia.fonte!=='phb2014'||!magiaReferenciada2014('bruxo',magia.nome)||
     magiaReferenciada2014('bruxo',magia.nome)?.nivel!==magia.nivel||
     vistos.has(magia.nivel))
    erros.push('Arcana Mística 2014 inválida para o nível do Bruxo: '+magia.nome+'.')
  vistos.add(magia.nivel)
 }
 if(usadas.some(x=>!marcadas.some(m=>m.nivel===x)))
  erros.push('Há um uso de Arcana Mística registrado sem a magia correspondente.')
 return erros
}
