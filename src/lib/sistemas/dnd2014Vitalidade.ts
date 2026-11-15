/** PV por nível da classe; CON é recalculada retroativamente (Basic Rules 2014). */
import type { DadosFicha } from './tipos'
import { classesDaFicha2014 } from './dnd2014Multiclasse'
export function niveisVida2014(d: Pick<DadosFicha,'campos'|'dnd2014Multiclasse'>) {
 return classesDaFicha2014(d).lista.flatMap(c=>Array.from({length:c.nivel},(_,i)=>({
  id:c.cls.id+':'+(i+1),nome:c.cls.nome+' · nível '+(i+1),dado:c.cls.dv,
  inicial:c.principal&&i===0,
 })))
}
export function pvPorNivel2014(d: Pick<DadosFicha,'campos'|'dnd2014Multiclasse'|'dnd2014VidaRolada'>,con:number,extra=0) {
 return niveisVida2014(d).reduce((s,n)=>{
  const r=d.dnd2014VidaRolada?.[n.id]
  const valor=n.inicial?n.dado:typeof r==='number'&&Number.isInteger(r)&&r>=1&&r<=n.dado?r:Math.floor(n.dado/2)+1
  return s+Math.max(1,valor+con)
 },extra)
}
export function validarVida2014(antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024') {
 const mudou=JSON.stringify(antes.dnd2014VidaRolada)!==JSON.stringify(depois.dnd2014VidaRolada)
 if(edicao!=='phb2014')return mudou?['PV por nível 2014 não podem ser alterados numa ficha 2024.']:[]
 if(!mudou&&JSON.stringify(antes.dnd2014Multiclasse)===JSON.stringify(depois.dnd2014Multiclasse)&&antes.campos?.nivel===depois.campos?.nivel&&antes.campos?.classe===depois.campos?.classe)return []
 const r=depois.dnd2014VidaRolada
 if(r===undefined)return []
 if(!r||typeof r!=='object'||Array.isArray(r))return ['Registro de PV rolados inválido.']
 const niveis=niveisVida2014(depois as DadosFicha)
 return Object.entries(r).some(([id,v])=>{
  const n=niveis.find(x=>x.id===id)
  return !n||n.inicial||!Number.isInteger(v)||v<1||v>n.dado
 })?['PV rolados: registre um resultado válido do Dado de Vida para cada nível adquirido; o primeiro nível usa o dado máximo.']:[]
}
