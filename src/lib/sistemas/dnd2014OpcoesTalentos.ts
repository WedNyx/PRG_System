/** Escolhas verificáveis dos talentos do PHB 2014.
 * Só concede +1 de atributo se a escolha foi registrada, o talento está ativo
 * e os atributos-base estão confirmados, evitando duplicar fichas antigas.
 * Efeitos situacionais continuam sob responsabilidade da mesa.
 */
import type {DadosFicha} from './tipos'
export const ATRIBUTOS_TALENTO_2014=['FOR','DES','CON','INT','SAB','CAR'] as const
type DefinicaoOpcao={titulo:string;opcoes:readonly string[];bonusAtributo?:boolean}
const todos=ATRIBUTOS_TALENTO_2014
const forDes=['FOR','DES'] as const
export const OPCOES_TALENTOS_2014:Record<string,DefinicaoOpcao>={
 'ADEPTO ELEMENTAL':{titulo:'Tipo de dano elemental',opcoes:['Ácido','Elétrico','Fogo','Frio','Trovão']},
 'ATOR':{titulo:'Aumento de Carisma',opcoes:['CAR'],bonusAtributo:true},
 'ATLETA':{titulo:'Atributo aumentado',opcoes:forDes,bonusAtributo:true},
 'ESPECIALISTA EM BRIGA':{titulo:'Atributo aumentado',opcoes:['FOR','CON'],bonusAtributo:true},
 'MENTE AFIADA':{titulo:'Aumento de Inteligência',opcoes:['INT'],bonusAtributo:true},
 'MESTRE DE ARMAS':{titulo:'Atributo aumentado',opcoes:forDes,bonusAtributo:true},
 'OBSERVADOR':{titulo:'Atributo aumentado',opcoes:['INT','SAB'],bonusAtributo:true},
 'POLIGLOTA':{titulo:'Aumento de Inteligência',opcoes:['INT'],bonusAtributo:true},
 'PROTEÇÃO LEVE':{titulo:'Aumento de Força',opcoes:['FOR'],bonusAtributo:true},
 'PROTEÇÃO MODERADA':{titulo:'Aumento de Força',opcoes:['FOR'],bonusAtributo:true},
 'PROTEÇÃO PESADA':{titulo:'Aumento de Força',opcoes:['FOR'],bonusAtributo:true},
 'MAESTRIA EM ARMADURA PESADA':{titulo:'Aumento de Força',opcoes:['FOR'],bonusAtributo:true},
 'RESILIENTE':{titulo:'Atributo com +1 e nova salvaguarda',opcoes:todos,bonusAtributo:true},
 'RESISTENTE':{titulo:'Aumento de Constituição',opcoes:['CON'],bonusAtributo:true},
 'CONJURADOR DE RITUAL':{titulo:'Lista de magias do livro de rituais',opcoes:['Bardo','Bruxo','Clérigo','Druida','Feiticeiro','Mago']},
 'INICIADO EM MAGIA':{titulo:'Lista de magias para os dois truques e a magia de 1º nível',opcoes:['Bardo','Bruxo','Clérigo','Druida','Feiticeiro','Mago']},
}
export function bonusAtributosTalentos2014(
 d:Pick<DadosFicha,'dnd2014Talentos'|'dnd2014OpcoesTalentos'>
):Record<string,number>{
 const out:Record<string,number>={}
 for(const nome of d.dnd2014Talentos??[]){
  const def=OPCOES_TALENTOS_2014[nome]
  const escolha=d.dnd2014OpcoesTalentos?.[nome]
  if(def?.bonusAtributo&&escolha&&def.opcoes.includes(escolha))
    out[escolha]=(out[escolha]??0)+1
 }
 return out
}
export function validarOpcoesTalentos2014(
 antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024'
):string[]{
 const old=JSON.stringify(antes.dnd2014OpcoesTalentos??{})
 const curr=JSON.stringify(depois.dnd2014OpcoesTalentos??{})
 if(old===curr&&JSON.stringify(antes.dnd2014Talentos??[])===JSON.stringify(depois.dnd2014Talentos??[]))return []
 if(edicao!=='phb2014')return old===curr?[]:['Escolhas de talentos 2014 indisponíveis na ficha 2024.']
 const data=depois.dnd2014OpcoesTalentos
 if(data===undefined)return []
 if(!data||typeof data!=='object'||Array.isArray(data))return ['Escolhas de talentos 2014 inválidas.']
 const erros:string[]=[]
 for(const [nome,opcao] of Object.entries(data)){
  if(!(depois.dnd2014Talentos??[]).includes(nome)||typeof opcao!=='string'||
    !OPCOES_TALENTOS_2014[nome]?.opcoes.includes(opcao))
    erros.push('Opção de talento incompatível ou não selecionado: '+nome+'.')
 }
 return erros
}
