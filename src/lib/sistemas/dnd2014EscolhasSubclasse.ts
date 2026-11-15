/** Decisões de arquétipo no PHB 2014, capítulos de classes.
 * Apenas metadados curtos de escolha; efeitos são interpretados pela mesa.
 * A exigência depende do NÍVEL NA CLASSE, não do nível total.
 */
import type {DadosFicha} from './tipos'
import {classesDaFicha2014} from './dnd2014Multiclasse'
import {subclasseDaFicha2014} from './dnd2014Subclasses'

export type GrupoDecisao2014={
 id:string;titulo:string;nivel:number;quantidade:number;opcoes:readonly string[]
}
export type EscolhasSubclasse2014={subclasse:string; grupos:Record<string,string[]>}
const g=(id:string,titulo:string,nivel:number,quantidade:number,...opcoes:string[]):GrupoDecisao2014=>({id,titulo,nivel,quantidade,opcoes})
const TOTENS=['Águia','Lobo','Urso'] as const
export const ESCOLHAS_SUBCLASSES_2014:Record<string,readonly GrupoDecisao2014[]>={
 'guerreiro-totem':[
  g('espirito','Totem Espiritual',3,1,...TOTENS),
  g('aspecto','Aspecto da Besta',6,1,...TOTENS),
  g('sintonia','Sintonia Totêmica',14,1,...TOTENS),
 ],
 'terra':[g('terreno','Terreno do Círculo da Terra',2,1,
  'Ártico','Costa','Deserto','Floresta','Montanha','Pântano','Planície','Subterrâneo')],
 'mestre-batalha':[
  g('manobras-3','Manobras iniciais',3,3,
    'Ataque Ameaçador','Ataque de Encontrão','Ataque de Precisão','Ataque de Provocação',
    'Ataque Desarmante','Ataque Distrativo','Ataque em Varredura','Ataque Estendido',
    'Ataque Falso','Ataque para Derrubar','Contra-ataque','Golpe do Comandante',
    'Golpe de Manobra','Jogo de Pernas Evasivo','Raparada','Reagrupar'),
  g('manobras-7','Duas manobras adicionais',7,2,
    'Ataque Ameaçador','Ataque de Encontrão','Ataque de Precisão','Ataque de Provocação',
    'Ataque Desarmante','Ataque Distrativo','Ataque em Varredura','Ataque Estendido',
    'Ataque Falso','Ataque para Derrubar','Contra-ataque','Golpe do Comandante',
    'Golpe de Manobra','Jogo de Pernas Evasivo','Raparada','Reagrupar'),
  g('manobras-10','Duas manobras adicionais',10,2,
    'Ataque Ameaçador','Ataque de Encontrão','Ataque de Precisão','Ataque de Provocação',
    'Ataque Desarmante','Ataque Distrativo','Ataque em Varredura','Ataque Estendido',
    'Ataque Falso','Ataque para Derrubar','Contra-ataque','Golpe do Comandante',
    'Golpe de Manobra','Jogo de Pernas Evasivo','Raparada','Reagrupar'),
  g('manobras-15','Duas manobras adicionais',15,2,
    'Ataque Ameaçador','Ataque de Encontrão','Ataque de Precisão','Ataque de Provocação',
    'Ataque Desarmante','Ataque Distrativo','Ataque em Varredura','Ataque Estendido',
    'Ataque Falso','Ataque para Derrubar','Contra-ataque','Golpe do Comandante',
    'Golpe de Manobra','Jogo de Pernas Evasivo','Raparada','Reagrupar'),
 ],
 'cacador':[
  g('presa','Presa do Caçador',3,1,'Matador de Colossos','Assassino de Gigantes','Destruidor de Hordas'),
  g('defesa','Táticas Defensivas',7,1,'Escapar da Horda','Defesa Contra Ataques Múltiplos','Vontade de Aço'),
  g('ataque','Ataque Múltiplo',11,1,'Saraivada','Ataque Giratório'),
  g('superior','Defesa Superior do Caçador',15,1,'Evasão','Manter-se Contra a Maré','Esquiva Sobrenatural'),
 ],
}
export function gruposSubclasseDaFicha2014(d:DadosFicha,classeId:string):GrupoDecisao2014[]{
 const classe=classesDaFicha2014(d).lista.find(x=>x.cls.id===classeId)
 const sub=classe&&subclasseDaFicha2014(d,classeId)
 if(!classe||!sub)return []
 return [...(ESCOLHAS_SUBCLASSES_2014[sub.id]??[])].filter(g=>classe.nivel>=g.nivel)
}
export function validarEscolhasSubclasses2014(antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024'):string[]{
 const novo=JSON.stringify(depois.dnd2014EscolhasSubclasse??{})
 const antigo=JSON.stringify(antes.dnd2014EscolhasSubclasse??{})
 const mudou=novo!==antigo
 if(!mudou&&JSON.stringify(antes.dnd2014Subclasses??{})===JSON.stringify(depois.dnd2014Subclasses??{})&&
   antes.dnd2014Subclasse===depois.dnd2014Subclasse&&
   JSON.stringify(antes.dnd2014Multiclasse??{})===JSON.stringify(depois.dnd2014Multiclasse??{})&&
   JSON.stringify(antes.campos??{})===JSON.stringify(depois.campos??{}))return []
 if(edicao!=='phb2014')return mudou?['Escolhas de subclasses 2014 não podem ser alteradas na edição 2024.']:[]
 const dados=depois.dnd2014EscolhasSubclasse
 if(dados===undefined)return []
 if(!dados||typeof dados!=='object'||Array.isArray(dados))return ['Formato inválido de escolhas das subclasses.']
 const d=depois as DadosFicha
 const erros:string[]=[]
 for(const [classeId,valor] of Object.entries(dados)){
  if(!valor||typeof valor!=='object'||Array.isArray(valor)){
    erros.push('Escolhas da classe '+classeId+' inválidas.');continue
  }
  const sub=subclasseDaFicha2014(d,classeId)
  if(!sub||valor.subclasse!==sub.id||!valor.grupos||typeof valor.grupos!=='object'||Array.isArray(valor.grupos)){
    erros.push('As escolhas da subclasse '+classeId+' precisam corresponder à subclasse atual.');continue
  }
  const grupos=gruposSubclasseDaFicha2014(d,classeId)
  const escolhidasGlobais=new Set<string>()
  for(const [id,lista] of Object.entries(valor.grupos)){
    const grupo=grupos.find(g=>g.id===id)
    if(!grupo||!Array.isArray(lista)||lista.length>grupo.quantidade||
       lista.some(x=>typeof x!=='string'||!grupo.opcoes.includes(x))||
       new Set(lista).size!==lista.length){
      erros.push('Escolha inválida ou indisponível da subclasse '+classeId+': '+id+'.');continue
    }
    if(id.startsWith('manobras-'))for(const nome of lista){
      if(escolhidasGlobais.has(nome))erros.push('Manobra repetida de Mestre de Batalha: '+nome+'.')
      escolhidasGlobais.add(nome)
    }
  }
 }
 return erros
}
