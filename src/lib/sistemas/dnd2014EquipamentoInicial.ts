/** Equipamento inicial PHB 2014, capítulo 5, p. 145 (tabela de riqueza).
 * Kits permanecem manuais: nunca aplicar itens ou armaduras inventados/duplicados.
 */
import type { DadosFicha } from './tipos'
import { lerUso } from './inventario'

const DADOS:Record<string,readonly [number,number]>={
  'Bárbaro':[2,10], 'Bardo':[5,10], 'Bruxo':[4,10], 'Clérigo':[5,10],
  'Druida':[2,10], 'Feiticeiro':[3,10], 'Guerreiro':[5,10], 'Ladino':[4,10],
  'Mago':[4,10], 'Monge':[5,1], 'Paladino':[5,10], 'Patrulheiro':[5,10],
}
export type RegistroEquipamento2014 = {
  modo:'kit'|'ouro'
  classe:string
  antecedente:string
  /** Confirmação de que os equipamentos de classe E de antecedente foram lançados no inventário. */
  conferido?:boolean
  /** Dados d4 efetivamente rolados quando escolheu ouro em vez dos kits. */
  dados?:number[]
}
export function formulaRiquezaInicial2014(classe:string) {
  const r=DADOS[classe]
  return r?{dados:r[0],multiplicador:r[1],expressao:r[0]+'d4'+(r[1]===1?'':' × '+r[1])+' PO'}:null
}
export function totalRiquezaInicial2014(classe:string,dados:readonly number[]):number|null {
  const f=formulaRiquezaInicial2014(classe)
  return f&&dados.length===f.dados&&dados.every(n=>Number.isInteger(n)&&n>=1&&n<=4)
    ? dados.reduce((a,b)=>a+b,0)*f.multiplicador:null
}
export function rolarRiquezaInicial2014(classe:string,aleatorio:()=>number=Math.random) {
  const f=formulaRiquezaInicial2014(classe)
  if(!f)return null
  const dados=Array.from({length:f.dados},()=>Math.floor(Math.max(0,Math.min(0.999999999,aleatorio()))*4)+1)
  return {dados,ouro:totalRiquezaInicial2014(classe,dados)!}
}
export function escolherKitInicial2014(d:DadosFicha):DadosFicha {
  return {...d,dnd2014EquipamentoInicial:{
    modo:'kit',classe:String(d.campos.classe??''),antecedente:String(d.campos.antecedente??''),conferido:false,
  }}
}
/** Rola ouro apenas após escolha explícita. A carteira preenchida nunca é sobrescrita. */
export function escolherOuroInicial2014(d:DadosFicha,aleatorio:()=>number=Math.random):DadosFicha|null {
  const classe=String(d.campos.classe??''),antecedente=String(d.campos.antecedente??'')
  const resultado=rolarRiquezaInicial2014(classe,aleatorio)
  if(!resultado)return null
  const uso=lerUso(d.uso)
  return {...d,dnd2014EquipamentoInicial:{modo:'ouro',classe,antecedente,dados:resultado.dados},
    uso:uso.carteira.trim()?d.uso:{...uso,carteira:resultado.ouro+' PO'},
  }
}
export function registroEquipamentoAtual2014(d:Partial<DadosFicha>):boolean {
  const r=d.dnd2014EquipamentoInicial
  if(!r||r.classe!==d.campos?.classe||r.antecedente!==d.campos?.antecedente)return false
  return r.modo==='ouro'?totalRiquezaInicial2014(r.classe,r.dados??[])!==null
    :r.modo==='kit'&&r.conferido===true
}
export function validarEquipamentoInicial2014(antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024'):string[] {
  const mudou=JSON.stringify(antes.dnd2014EquipamentoInicial)!==JSON.stringify(depois.dnd2014EquipamentoInicial)
  if(!mudou)return []
  if(edicao!=='phb2014')return ['Equipamento inicial de 2014 não pode ser alterado em ficha 2024.']
  const r=depois.dnd2014EquipamentoInicial
  if(r===undefined)return []
  if(!r||typeof r!=='object'||typeof r.classe!=='string'||typeof r.antecedente!=='string'
    ||r.classe!==depois.campos?.classe||r.antecedente!==depois.campos?.antecedente)
    return ['O equipamento inicial deve pertencer à classe e ao antecedente atuais.']
  if(!formulaRiquezaInicial2014(r.classe)) return ['A classe não está disponível para riqueza inicial de 2014.']
  if(r.modo==='ouro' && totalRiquezaInicial2014(r.classe,r.dados??[])!==null) return []
  if(r.modo==='kit'&&typeof r.conferido==='boolean'
    &&r.dados===undefined
    &&(!r.conferido||(Array.isArray(depois.itens)&&depois.itens.length>0))) return []
  return ['Escolha equipamento de classe e antecedente no inventário ou uma rolagem válida de riqueza inicial.']
}
