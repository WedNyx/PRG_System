/**
 * Conjuração multiclasse D&D 2014 — SRD 5.1 (CC BY 4.0).
 * A edição de 2014 arredonda Paladino/Patrulheiro PARA BAIXO na multiclasse.
 * Em 2024, são arredondados para cima (motor dnd2024Classes separado).
 */
import type { DadosFicha } from './tipos'
import { classesDaFicha, type ClasseNaFicha } from './dnd2024Classes'

export const SLOTS_2014: number[][] = [
  [0,0,0,0,0,0,0,0,0],
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],
  [4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],
  [4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],
  [4,3,3,3,3,2,2,1,1],[4,3,3,3,3,2,2,1,1],
]
const CHEIOS = new Set(['bardo','clerigo','druida','feiticeiro','mago'])
const MEIOS = new Set(['paladino','patrulheiro'])
const TERCOS = new Map([['guerreiro','cavaleiro-arcano'],['ladino','trapaceiro-arcano']])
export function classesDaFicha2014(
  d: Pick<DadosFicha,'campos'|'dnd2014Multiclasse'>,
): ReturnType<typeof classesDaFicha> {
  return classesDaFicha({campos:d.campos,dndMulticlasse:d.dnd2014Multiclasse})
}
export type Espacos2014 = {
  espacos:number[]; nivelConjurador:number; multiclasse:boolean;
  pacto:number; pactoNivel:number; conjuradores:string[];
}
export function espacosDeMagia2014(lista: ClasseNaFicha[], subclasseInicial?:string):Espacos2014 {
  const conjuradores=lista.filter(c=>{
    const id=c.cls.id
    return CHEIOS.has(id) || (MEIOS.has(id) && c.nivel>=2) ||
      (TERCOS.has(id) && c.nivel>=3 && c.principal && TERCOS.get(id)===subclasseInicial)
  })
  // Bruxo usa Magia de Pacto separada da tabela de Conjuração.
  const bruxo=lista.find(c=>c.cls.id==='bruxo')
  const nivelBruxo=bruxo?.nivel??0
  const pacto=nivelBruxo>=17?4:nivelBruxo>=11?3:nivelBruxo>=2?2:nivelBruxo>=1?1:0
  const pactoNivel=nivelBruxo>=9?5:nivelBruxo>=7?4:nivelBruxo>=5?3:nivelBruxo>=3?2:nivelBruxo>=1?1:0
  let nivelConjurador=0
  if(conjuradores.length===1) {
    const c=conjuradores[0]
    // Tabelas de classe única: o paladino de nível 3 tem 3 espaços, não 2.
    nivelConjurador=CHEIOS.has(c.cls.id)?c.nivel:
      MEIOS.has(c.cls.id)?Math.ceil(c.nivel/2):Math.ceil(c.nivel/3)
  } else if(conjuradores.length>1) {
    nivelConjurador = conjuradores.reduce((acc, c) =>
      acc + (CHEIOS.has(c.cls.id) ? c.nivel : MEIOS.has(c.cls.id) ? Math.floor(c.nivel / 2) : Math.floor(c.nivel / 3)), 0)
  }
  nivelConjurador=Math.min(20,Math.max(0,nivelConjurador))
  const espacos=[0,...(SLOTS_2014[nivelConjurador]??SLOTS_2014[0])]
  return {espacos,nivelConjurador,multiclasse:conjuradores.length>1,pacto,pactoNivel,
    conjuradores:conjuradores.map(c=>c.cls.id)}
}
