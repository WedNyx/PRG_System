/** Avanço de personagem — PHB 2014, capítulo 1, tabela da p. 15 impressa.
 * XP pode ser usado como referência; campanhas por marcos mantêm nível manual.
 */
import type { DadosFicha } from './tipos'

export const XP_MINIMOS_2014 = [
  0,300,900,2700,6500,14000,23000,34000,48000,64000,
  85000,100000,120000,140000,165000,195000,225000,265000,305000,355000,
] as const

export function nivelParaXp2014(xp: number): number {
  if (!Number.isFinite(xp) || xp < 0) return 1
  for (let i=XP_MINIMOS_2014.length-1;i>=0;i--) if (xp>=XP_MINIMOS_2014[i]) return i+1
  return 1
}
export function xpParaNivel2014(nivel:number): number {
  const n=Math.max(1,Math.min(20,Math.trunc(nivel)||1))
  return XP_MINIMOS_2014[n-1]
}
export function progressoXp2014(xp:number, nivel:number) {
  const atual=Math.max(1,Math.min(20,Math.floor(nivel)||1))
  const valor=Number.isFinite(xp)&&xp>=0?Math.floor(xp):0
  const proximo=atual===20?null:xpParaNivel2014(atual+1)
  return {xp:valor,nivel:atual,nivelPeloXp:nivelParaXp2014(valor),
    proximo, faltam:proximo===null?0:Math.max(0,proximo-valor)}
}
export function validarExperiencia2014(antes: Partial<DadosFicha>,depois: Partial<DadosFicha>,edicao:'phb2014'|'phb2024'):string[] {
  if(edicao!=='phb2014'||antes.campos?.xp===depois.campos?.xp) return []
  const xp=depois.campos?.xp
  return typeof xp==='number'&&Number.isInteger(xp)&&xp>=0&&xp<=1_000_000_000?[]
    : ['XP do D&D 2014 deve ser um número inteiro não negativo.']
}
