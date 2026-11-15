/**
 * Estado explícito de uma única concentração ativa (PHB 2014, cap. 10).
 * Não altera dano, CD, componentes nem efeitos das magias.
 * A ficha ajuda a registrar uma condição decidida pelo jogador/mestre.
 */
import type { DadosFicha } from './tipos'

export type ConcentracaoDnd2014 = { magiaId:string; nome:string }
export const cdConcentracaoDano2014=(dano:number):number=>
  Math.max(10,Math.floor(Math.max(0,Number.isFinite(dano)?dano:0)/2))
export function iniciarConcentracao2014(d:DadosFicha,magiaId:string):DadosFicha {
  const magia=d.dnd2014Magias?.find(m=>m.id===magiaId)
  if(!magia||magia.concentracao!==true)return d
  return {...d,dnd2014Concentracao:{magiaId:magia.id,nome:magia.nome}}
}
export function encerrarConcentracao2014(d:DadosFicha):DadosFicha {
  return {...d,dnd2014Concentracao:undefined}
}
export function validarConcentracao2014(
  antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024',
):string[] {
  const a=JSON.stringify(antes.dnd2014Concentracao??null)
  const b=JSON.stringify(depois.dnd2014Concentracao??null)
  if(a===b && JSON.stringify(antes.dnd2014Magias??[])===JSON.stringify(depois.dnd2014Magias??[]))return []
  if(edicao!=='phb2014')
    return a===b?[]:['Concentração do PHB 2014 não pode ser modificada em uma ficha 2024.']
  const valor=depois.dnd2014Concentracao
  if(!valor)return []
  if(typeof valor.magiaId!=='string'||typeof valor.nome!=='string'||valor.nome.length>100)
    return ['Concentração inválida.']
  const magia=depois.dnd2014Magias?.find(m=>m.id===valor.magiaId&&m.nome===valor.nome&&m.concentracao===true)
  return magia?[]:['A concentração ativa deve apontar para uma magia registrada que exige concentração.']
}
