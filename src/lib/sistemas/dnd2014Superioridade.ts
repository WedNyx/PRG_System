/** Rastreador de Superioridade em Combate do Mestre de Batalha.
 * PHB 2014 (p. impressa 86–87): 4d8 nível 3, +1 dado no nível
 * 7 e 15, d10 no nível 10, d12 no nível 18; descanso curto/longo.
 * Não executa o efeito situacional de nenhuma manobra.
 */
import type {DadosFicha} from './tipos'
import {classesDaFicha2014} from './dnd2014Multiclasse'
import {subclasseDaFicha2014} from './dnd2014Subclasses'

export function dadosSuperioridade2014(d:Pick<DadosFicha,'campos'|'dnd2014Multiclasse'|'dnd2014Subclasse'|'dnd2014Subclasses'|'dnd2014DadosSuperioridadeUsados'>){
 const lutador=classesDaFicha2014(d).lista.find(x=>x.cls.id==='guerreiro')
 if(!lutador||lutador.nivel<3||subclasseDaFicha2014(d,'guerreiro')?.id!=='mestre-batalha')
   return null
 const nivel=lutador.nivel
 const maximo=nivel>=15?6:nivel>=7?5:4
 const dado=nivel>=18?'d12':nivel>=10?'d10':'d8'
 const usados=Math.max(0,Math.min(maximo,Number(d.dnd2014DadosSuperioridadeUsados)||0))
 return {nivelClasse:nivel,maximo,dado,usados,restantes:maximo-usados}
}
export function gastarSuperioridade2014(d:DadosFicha):DadosFicha|null{
 const atual=dadosSuperioridade2014(d)
 return atual&&atual.restantes>0
   ?{...d,dnd2014DadosSuperioridadeUsados:atual.usados+1}:null
}
export function recuperarSuperioridade2014(d:DadosFicha):DadosFicha {
 return {...d,dnd2014DadosSuperioridadeUsados:0}
}
export function validarSuperioridade2014(
 antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024',
):string[]{
 const a=antes.dnd2014DadosSuperioridadeUsados, b=depois.dnd2014DadosSuperioridadeUsados
 if(a===b && JSON.stringify(antes.dnd2014Subclasses??{})===JSON.stringify(depois.dnd2014Subclasses??{}) &&
   antes.dnd2014Subclasse===depois.dnd2014Subclasse &&
   JSON.stringify(antes.dnd2014Multiclasse??{})===JSON.stringify(depois.dnd2014Multiclasse??{}) &&
   antes.campos?.nivel===depois.campos?.nivel && antes.campos?.classe===depois.campos?.classe)return []
 if(edicao!=='phb2014')return a===b?[]:['Dados de Superioridade 2014 não são editáveis em fichas 2024.']
 if(b===undefined)return []
 // Valor zerado pode permanecer em uma ficha depois de mudar de arquétipo.
 if(b===0)return []
 if(!Number.isInteger(b)||b<0)return ['Dados de Superioridade gastos precisam ser inteiros não negativos.']
 const dados=dadosSuperioridade2014(depois as DadosFicha)
 if(!dados||b>dados.maximo)return ['Dados de Superioridade gastos excedem os disponíveis para este Mestre de Batalha.']
 return []
}
