/**
 * Classes e arquétipos de D&D 5e — Player's Handbook de 2014.
 * Identificação bibliográfica, sem reproduzir o texto de subclasses comerciais.
 * Cada classe tem uma opção aberta no SRD 5.1, CC BY 4.0.
 */
export type SubclasseDnd2014 = {
  id: string; nome: string; classe: string; nivel: number;
  fonte: 'srd51' | 'phb2014';
  /** Marcos da subclasse aberta: referências, NÃO concessão automática de efeitos. */
  marcos?: { nivel: number; nome: string }[];
}
const sr = (classe:string,id:string,nome:string,nivel:number,marcos:[number,string][]):SubclasseDnd2014 =>
  ({classe,id,nome,nivel,fonte:'srd51',marcos:marcos.map(([nivel,nome])=>({nivel,nome}))})
const phb = (classe:string,nivel:number,...opcoes:[string,string][]):SubclasseDnd2014[] =>
  opcoes.map(([id,nome])=>({classe,id,nome,nivel,fonte:'phb2014'}))

export const SUBCLASSES_DND_2014: SubclasseDnd2014[] = [
  sr('Bárbaro','berserker','Caminho do Berserker',3,
    [[3,'Frenesi'],[6,'Fúria Irracional'],[10,'Presença Intimidadora'],[14,'Retaliação']]),
  ...phb('Bárbaro',3,['guerreiro-totem','Caminho do Guerreiro Totêmico']),
  sr('Bardo','conhecimento','Colégio do Conhecimento',3,
    [[3,'Proficiências Bônus e Palavras Cortantes'],[6,'Segredos Mágicos Adicionais'],[14,'Perícia Inigualável']]),
  ...phb('Bardo',3,['valor','Colégio do Valor']),
  sr('Clérigo','vida','Domínio da Vida',1,
    [[1,'Discípulo da Vida'],[2,'Preservar a Vida'],[6,'Curandeiro Abençoado'],[8,'Ataque Divino'],[17,'Cura Suprema']]),
  ...phb('Clérigo',1,['conhecimento','Domínio do Conhecimento'],['luz','Domínio da Luz'],
    ['natureza','Domínio da Natureza'],['tempestade','Domínio da Tempestade'],
    ['trapaca','Domínio da Trapaça'],['guerra','Domínio da Guerra']),
  sr('Druida','terra','Círculo da Terra',2,
    [[2,'Truque Adicional e Recuperação Natural'],[3,'Magias do Círculo'],
      [6,'Passo da Terra'],[10,'Proteção da Natureza'],[14,'Santuário da Natureza']]),
  ...phb('Druida',2,['lua','Círculo da Lua']),
  sr('Guerreiro','campeao','Campeão',3,
    [[3,'Crítico Aprimorado'],[7,'Atleta Notável'],[10,'Estilo de Luta Adicional'],
      [15,'Crítico Superior'],[18,'Sobrevivente']]),
  ...phb('Guerreiro',3,['mestre-batalha','Mestre de Batalha'],['cavaleiro-arcano','Cavaleiro Arcano']),
  sr('Monge','mao-aberta','Caminho da Mão Aberta',3,
    [[3,'Técnica da Mão Aberta'],[6,'Integridade Corporal'],[11,'Tranquilidade'],[17,'Palma Vibrante']]),
  ...phb('Monge',3,['sombra','Caminho da Sombra'],['quatro-elementos','Caminho dos Quatro Elementos']),
  sr('Paladino','devocao','Juramento da Devoção',3,
    [[3,'Canalizar Divindade: Arma Sagrada e Expulsar Profanos'],
      [7,'Aura de Devoção'],[15,'Pureza de Espírito'],[20,'Nimbo Sagrado']]),
  ...phb('Paladino',3,['anciaos','Juramento dos Anciãos'],['vinganca','Juramento da Vingança']),
  sr('Patrulheiro','cacador','Caçador',3,
    [[3,'Presa do Caçador'],[7,'Táticas Defensivas'],[11,'Ataque Múltiplo'],[15,'Defesa Superior do Caçador']]),
  ...phb('Patrulheiro',3,['senhor-bestias','Senhor das Bestas']),
  sr('Ladino','ladrao','Ladrão',3,
    [[3,'Mãos Rápidas e Andarilho de Telhados'],[9,'Furtividade Suprema'],
      [13,'Usar Dispositivo Mágico'],[17,'Reflexos de Ladrão']]),
  ...phb('Ladino',3,['assassino','Assassino'],['trapaceiro-arcano','Trapaceiro Arcano']),
  sr('Feiticeiro','draconica','Linhagem Dracônica',1,
    [[1,'Ancestral Dracônico e Resiliência Dracônica'],[6,'Afinidade Elemental'],
      [14,'Asas de Dragão'],[18,'Presença Dracônica']]),
  ...phb('Feiticeiro',1,['magia-selvagem','Magia Selvagem']),
  sr('Bruxo','corruptor','O Corruptor',1,
    [[1,'Bênção do Tenebroso'],[6,'Sorte do Tenebroso'],[10,'Resiliência Corruptora'],[14,'Arremessar pelo Inferno']]),
  ...phb('Bruxo',1,['arquifada','Arquifada'],['grande-antigo','Grande Antigo']),
  sr('Mago','evocacao','Escola de Evocação',2,
    [[2,'Erudito da Evocação e Esculpir Magias'],[6,'Truque Potente'],
      [10,'Evocação Potencializada'],[14,'Sobrecarga']]),
  ...phb('Mago',2,['abjuracao','Escola de Abjuração'],['conjuracao','Escola de Conjuração'],
    ['adivinhacao','Escola de Adivinhação'],['encantamento','Escola de Encantamento'],
    ['ilusao','Escola de Ilusão'],['necromancia','Escola de Necromancia'],
    ['transmutacao','Escola de Transmutação']),
]
export function subclassesDaClasse2014(classe:unknown):SubclasseDnd2014[] {
  return typeof classe==='string' ? SUBCLASSES_DND_2014.filter(x=>x.classe===classe) : []
}
export function subclasseDnd2014(classe:unknown,id:unknown):SubclasseDnd2014|null {
  return subclassesDaClasse2014(classe).find(x=>x.id===id)??null
}
export function subclasseAtivaDnd2014(classe:unknown,id:unknown,nivel:unknown):SubclasseDnd2014|null {
  const sub=subclasseDnd2014(classe,id)
  const n=Number(nivel)
  return sub && Number.isInteger(n) && n>=sub.nivel ? sub : null
}
export function validarSubclasseDnd2014(
  antes: {campos?:Record<string,unknown>;dnd2014Subclasse?:string},
  depois: {campos?:Record<string,unknown>;dnd2014Subclasse?:string},
):string[] {
  if(antes.dnd2014Subclasse===depois.dnd2014Subclasse &&
    antes.campos?.classe===depois.campos?.classe &&
    antes.campos?.nivel===depois.campos?.nivel) return []
  const id=depois.dnd2014Subclasse
  if(!id)return []
  return subclasseAtivaDnd2014(depois.campos?.classe,id,depois.campos?.nivel)?[]
    : ['A subclasse escolhida não existe para esta classe ou ainda não está disponível no nível atual do D&D 2014.']
}
