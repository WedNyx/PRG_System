/** Criação PHB 2014, cap. 1; incrementos, cap. 3. Não migra totais antigos. */
import type { DadosFicha } from './tipos'
import { classesDaFicha2014 } from './dnd2014Multiclasse'
export const ATRS_2014 = ['FOR','DES','CON','INT','SAB','CAR'] as const
export type MetodoAtributos2014 = 'manual' | 'padrao' | 'pontos' | 'rolagem'
export const CONJUNTO_2014 = [15,14,13,12,10,8]
export const CUSTOS_2014: Record<number,number> = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}
export type Incremento2014 = { atributos: string[] }
export function marcosIncremento2014(d: Pick<DadosFicha,'campos'|'dnd2014Multiclasse'>) {
  return classesDaFicha2014(d).lista.flatMap(c =>
    (c.cls.id === 'guerreiro' ? [4,6,8,12,14,16,19] : c.cls.id === 'ladino' ? [4,8,10,12,16,19] : [4,8,12,16,19])
      .filter(n => n <= c.nivel).map(n => ({id:c.cls.id+':'+n, nome:c.cls.nome+' · nível '+n})))
}
export function rolarAtributos2014(aleatorio: () => number = Math.random): number[][] {
  return Array.from({length:6}, () => Array.from({length:4}, () => Math.floor(aleatorio()*6)+1))
}
export function totalRolagem2014(dados: number[]) { return dados.reduce((a,b)=>a+b,0)-Math.min(...dados) }
export function diagnosticoAtributos2014(d: Partial<DadosFicha>): string[] {
  const metodo = d.dnd2014MetodoAtributos ?? 'manual'
  if (!['manual','padrao','pontos','rolagem'].includes(metodo)) return ['Método de atributos 2014 inválido.']
  if (metodo === 'manual') return []
  const base = d.dnd2014AtributosBase
  if (!base || ATRS_2014.some(a => !Number.isInteger(base[a]))) return ['Confirme os seis atributos-base.']
  const valores = ATRS_2014.map(a=>base[a])
  const iguais = (a:number[],b:number[]) => JSON.stringify([...a].sort((a,b)=>a-b))===JSON.stringify([...b].sort((a,b)=>a-b))
  if (metodo === 'padrao' && !iguais(valores,CONJUNTO_2014)) return ['Distribua o conjunto padrão: 15, 14, 13, 12, 10 e 8.']
  if (metodo === 'pontos') {
    if (valores.some(v=> !Object.hasOwn(CUSTOS_2014,v))) return ['Compra de pontos: cada atributo-base deve estar entre 8 e 15.']
    const custo = valores.reduce((s,v)=>s+CUSTOS_2014[v],0)
    if (custo !== 27) return ['Compra de pontos: '+custo+' de 27 pontos gastos.']
  }
  if (metodo === 'rolagem') {
    const r = d.dnd2014RolagensAtributos
    if (!Array.isArray(r) || r.length!==6 || r.some(x=>!Array.isArray(x)||x.length!==4||x.some(v=>!Number.isInteger(v)||v<1||v>6)))
      return ['Registre seis rolagens de 4d6, descartando o menor dado de cada uma.']
    if (!iguais(valores,r.map(totalRolagem2014))) return ['Distribua exatamente os seis resultados das rolagens registradas.']
  }
  return []
}
export function bonusIncrementos2014(d: Pick<DadosFicha,'campos'|'dnd2014Multiclasse'|'dnd2014Incrementos'>): Record<string,number> {
  const bonus:Record<string,number> = {}
  for (const marco of marcosIncremento2014(d)) {
    const escolha=d.dnd2014Incrementos?.[marco.id]
    if (!escolha || !Array.isArray(escolha.atributos) || escolha.atributos.length!==2 || escolha.atributos.some(a=>!(ATRS_2014 as readonly string[]).includes(a))) continue
    for (const a of escolha.atributos) bonus[a]=(bonus[a]??0)+1
  }
  return bonus
}
export function validarProgressaoAtributos2014(antes: Partial<DadosFicha>, depois: Partial<DadosFicha>, edicao:'phb2014'|'phb2024'): string[] {
  const relevantes=['dnd2014MetodoAtributos','dnd2014RolagensAtributos','dnd2014Incrementos','dnd2014AtributosBase','dnd2014AtributosExtras','dnd2014Multiclasse','dnd2014Talentos'] as const
  const mudou = relevantes.some(k=>JSON.stringify(antes[k])!==JSON.stringify(depois[k])) || JSON.stringify(antes.campos)!==JSON.stringify(depois.campos)
  if (!mudou) return []
  const mudouNovos = relevantes.slice(0,3).some(k=>JSON.stringify(antes[k])!==JSON.stringify(depois[k]))
  if (edicao!=='phb2014') return mudouNovos ? ['Criação e incrementos 2014 não podem ser alterados numa ficha 2024.'] : []
  const erros:string[]=[]
  // Rascunhos podem ter distribuição incompleta; formato e limites são obrigatórios.
  const metodo=depois.dnd2014MetodoAtributos
  if (metodo!==undefined && !['manual','padrao','pontos','rolagem'].includes(metodo)) erros.push('Método de atributos 2014 inválido.')
  if (metodo==='pontos' && depois.dnd2014AtributosBase) {
    const v=ATRS_2014.map(a=>depois.dnd2014AtributosBase![a])
    if (v.some(x=>!Number.isInteger(x)||!Object.hasOwn(CUSTOS_2014,x)) || v.reduce((s,x)=>s+(CUSTOS_2014[x]??0),0)>27)
      erros.push('Compra de pontos: atributos de 8 a 15 e orçamento máximo de 27.')
  }
  if (antes.campos?.nivel!==depois.campos?.nivel &&
      (!Number.isInteger(depois.campos?.nivel)||Number(depois.campos?.nivel)<1||Number(depois.campos?.nivel)>20))
    erros.push('O nível de 2014 deve ser um inteiro de 1 a 20.')
  const r=depois.dnd2014RolagensAtributos
  if (r!==undefined && (!Array.isArray(r)||r.length!==6||r.some(x=>!Array.isArray(x)||x.length!==4||x.some(v=>!Number.isInteger(v)||v<1||v>6))))
    erros.push('Rolagens de atributos inválidas: informe seis grupos de quatro dados de 1 a 6.')
  if(metodo==='rolagem' && depois.dnd2014AtributosBase && ATRS_2014.some(a=>depois.dnd2014AtributosBase![a]<3||depois.dnd2014AtributosBase![a]>18))
    erros.push('Atributos rolados devem estar entre 3 e 18 antes dos bônus.')
  const inc=depois.dnd2014Incrementos
  if (inc!==undefined) {
    if (!inc || typeof inc!=='object' || Array.isArray(inc)) return [...erros,'Registro de incrementos 2014 inválido.']
    if (!depois.dnd2014AtributosBase && Object.keys(inc).length) erros.push('Confirme os atributos-base antes de aplicar incrementos automáticos.')
    const marcos=marcosIncremento2014(depois as DadosFicha)
    for (const [id,x] of Object.entries(inc)) {
      if (!marcos.some(m=>m.id===id) || !x || !Array.isArray(x.atributos) || x.atributos.length!==2 || x.atributos.some(a=>!(ATRS_2014 as readonly string[]).includes(a)))
        erros.push('Incremento inválido ou indisponível: '+id+'. Escolha +2 em um atributo ou +1 em dois.')
    }
    const variante=depois.campos?.especie==='Humano'&&depois.campos?.subraca2014==='Humano Variante'?1:0
    if (Object.keys(inc).length + Math.max(0,(depois.dnd2014Talentos?.length??0)-variante)>marcos.length)
      erros.push('Um mesmo Incremento de Atributo não pode conceder pontos e talento.')
  }
  return erros
}
