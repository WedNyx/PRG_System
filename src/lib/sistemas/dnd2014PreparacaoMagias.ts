/**
 * Preparação e limite de magias conhecidas do Livro do Jogador 2014.
 * As tabelas de "magias conhecidas" não incluem truques.
 * O Mago pode copiar magias adicionais no grimório: apenas suas magias
 * PREPARADAS são limitadas por nível + modificador de Inteligência.
 * Domínios juramentados e benefícios do mestre devem ser modo 'extra'.
 */
import type { DadosFicha } from './tipos'
import { classesDaFicha2014 } from './dnd2014Multiclasse'
import { atributosEfetivos2014 } from './dnd2014Regras'

export type LimiteMagias2014 = {
  classe:string
  nivelClasse:number
  tipo:'preparadas'|'conhecidas'|'grimorio'|'conferir'
  maximo:number|null
  atributo?:string
  descricao:string
}

const CONHECIDAS_2014:Record<string,readonly number[]>={
  bardo:[4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
  feiticeiro:[2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15],
  bruxo:[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15],
  patrulheiro:[0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11],
  guerreiro:[0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13],
  ladino:[0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13],
}

export function limiteMagiasPorClasse2014(
  d:Pick<DadosFicha,'campos'|'atributos'|'dnd2014AtributosBase'|'dnd2014AtributosExtras'|'dnd2014Incrementos'|'dnd2014Multiclasse'>,
  classeId:string,
):LimiteMagias2014|null {
  const found=classesDaFicha2014(d).lista.find(c=>c.cls.id===classeId)
  if(!found)return null
  const nivel=found.nivel
  if(!Number.isInteger(nivel)||nivel<1||nivel>20)return null
  if(['clerigo','druida','paladino','mago'].includes(classeId)){
    const attr=classeId==='paladino'?'CAR':classeId==='mago'?'INT':'SAB'
    const valores=atributosEfetivos2014(d)??d.atributos??{}
    const valor=valores[attr]
    const mod=typeof valor==='number'&&Number.isFinite(valor)?Math.floor((valor-10)/2):null
    const base=classeId==='paladino'?Math.floor(nivel/2):nivel
    return {classe:classeId,nivelClasse:nivel,tipo:classeId==='mago'?'grimorio':'preparadas',
      maximo:mod===null?null:Math.max(1,base+mod),atributo:attr,
      descricao:classeId==='mago'?'Magias preparadas de Mago; o grimório pode conter mais magias.':
        'Magias preparadas por dia, sem contar magias extras sempre preparadas.'}
  }
  const tabela=CONHECIDAS_2014[classeId]
  if(tabela){
    return {classe:classeId,nivelClasse:nivel,tipo:'conhecidas',maximo:tabela[nivel-1]??0,
      descricao:'Quantidade máxima de magias conhecidas da tabela de classe, sem contar truques ou extras.'}
  }
  return null
}
export function resumoPreparacaoMagias2014(d:DadosFicha,magias:{classe:string;nivel:number;modo:string}[]): {
 classe:string;tipo:string;total:number;maximo:number|null;descricao:string
}[] {
 const lista=classesDaFicha2014(d).lista
 return lista.flatMap(c=>{
   const limite=limiteMagiasPorClasse2014(d,c.cls.id)
   if(!limite)return []
   const total=magias.filter(m=>m.classe===c.cls.id&&m.nivel>0&&
     m.modo===(limite.tipo==='conhecidas'?'conhecida':'preparada')).length
   return [{classe:c.cls.nome,tipo:limite.tipo,total,maximo:limite.maximo,descricao:limite.descricao}]
 })
}
