/** Escolhas de características de classe do PHB 2014: não confundir
 * Dádiva de Pacto e Metamagia com subclasses/patronos.
 */
import type {DadosFicha} from './tipos'
import {classesDaFicha2014} from './dnd2014Multiclasse'
export type OpcoesClasseDnd2014={pactoBruxo?:string;metamagicas?:string[]}
export const PACTOS_BRUXO_2014=['Pacto da Corrente','Pacto da Lâmina','Pacto do Tomo'] as const
export const METAMAGICAS_2014=['Magia Acelerada','Magia Aumentada','Magia Cuidadosa','Magia Distante',
 'Magia Duplicada','Magia Estendida','Magia Potencializada','Magia Sutil'] as const
export function limiteMetamagia2014(nivel:number):number{
 return nivel<3?0:nivel<10?2:nivel<17?3:4
}
export function niveisConjuradores2014(d:Pick<DadosFicha,'campos'|'dnd2014Multiclasse'>){
 const cls=classesDaFicha2014(d).lista
 return {bruxo:cls.find(x=>x.cls.id==='bruxo')?.nivel??0,
   feiticeiro:cls.find(x=>x.cls.id==='feiticeiro')?.nivel??0}
}
export function validarOpcoesClasseDnd2014(
 antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024'
):string[]{
 const atual=JSON.stringify(depois.dnd2014OpcoesClasse??{})
 const antigo=JSON.stringify(antes.dnd2014OpcoesClasse??{})
 if(atual===antigo&&JSON.stringify(antes.dnd2014Multiclasse??{})===JSON.stringify(depois.dnd2014Multiclasse??{})&&
   antes.campos?.classe===depois.campos?.classe&&antes.campos?.nivel===depois.campos?.nivel)return []
 if(edicao!=='phb2014')return atual===antigo?[]:['Escolhas de classes 2014 não são editáveis em fichas 2024.']
 const x=depois.dnd2014OpcoesClasse
 if(x===undefined)return []
 if(!x||typeof x!=='object'||Array.isArray(x))return ['Escolhas de classe inválidas.']
 const n=niveisConjuradores2014(depois as DadosFicha)
 const erros:string[]=[]
 if(x.pactoBruxo!==undefined&&(!PACTOS_BRUXO_2014.includes(x.pactoBruxo as typeof PACTOS_BRUXO_2014[number])||n.bruxo<3))
   erros.push('Dádiva de Pacto exige Bruxo de nível 3 e uma escolha do PHB 2014.')
 if(x.metamagicas!==undefined&&(!Array.isArray(x.metamagicas)||
   x.metamagicas.length>limiteMetamagia2014(n.feiticeiro)||
   x.metamagicas.some(y=>typeof y!=='string'||!METAMAGICAS_2014.includes(y as typeof METAMAGICAS_2014[number]))||
   new Set(x.metamagicas).size!==x.metamagicas.length))
   erros.push('Metamagia excede a quantidade de opções do nível de Feiticeiro ou usa opções inválidas.')
 return erros
}

/** Custo de Metamagia do PHB 2014. Custos fixos ou por círculo da magia.
 * Verifica apenas o custo; alvo, alcance, ação e duração dependem da mesa.
 */
export function custoMetamagia2014(nome:string,nivelMagia:number):number|null {
 if(!METAMAGICAS_2014.some(x=>x===nome) || !Number.isInteger(nivelMagia) ||
    nivelMagia<0 || nivelMagia>9)return null
 if(nome==='Magia Acelerada')return 2
 if(nome==='Magia Aumentada')return 3
 if(nome==='Magia Duplicada')return Math.max(1,nivelMagia)
 return 1
}
export function usarMetamagia2014(
 d:DadosFicha,nome:string,nivelMagia:number,
):{ficha:DadosFicha;custo:number}|null {
 if(!d.dnd2014OpcoesClasse?.metamagicas?.includes(nome)||
    niveisConjuradores2014(d).feiticeiro<3)return null
 const custo=custoMetamagia2014(nome,nivelMagia)
 if(custo===null)return null
 const cap=niveisConjuradores2014(d).feiticeiro
 const recurso=d.recursos?.feiticaria
 // Uma ficha recém-criada pode ainda não ter inicializado o recurso.
 // Ausência não significa zero; recurso existente com zero nunca é recarregado aqui.
 const atual=recurso?.atual===undefined?cap:Number(recurso.atual)
 if(!Number.isFinite(atual)||atual<custo||atual>cap||atual<0)return null
 return {ficha:{...d,recursos:{...d.recursos,feiticaria:{
   ...(recurso??{}),atual:atual-custo,
 }}},custo}
}
