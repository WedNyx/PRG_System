/**
 * Marcos principais das 12 classes no D&D 5e (2014) para a árvore visual.
 * Fonte: SRD 5.1 / Basic Rules 2014, Wizards of the Coast (CC BY 4.0).
 * https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes
 *
 * São referências compactas de progressão, NÃO a concessão automática de
 * efeitos: somente os marcados 'automatico' têm suporte em dnd2014Regras.ts.
 * Subclasses, arquétipos, escolhas de talentos e rituais seguem manuais.
 */
export type MarcoClasse2014 = { nivel: number; nome: string; automatico?: boolean }
type Entrada = readonly [number,string,boolean?]
const lista = (entries: Entrada[]): MarcoClasse2014[] =>
  entries.map(([nivel,nome,automatico])=>({nivel,nome,...(automatico?{automatico:true}:{})}))

export const MARCOS_CLASSES_2014: Record<string, MarcoClasse2014[]> = {
 'Bárbaro': lista([
  [1,'Fúria',true],[1,'Defesa sem Armadura',true],[2,'Ataque Descuidado'],[2,'Sentido de Perigo'],
  [3,'Caminho Primal (escolha de subclasse)'],[5,'Ataque Extra'],[5,'Movimento Rápido',true],
  [7,'Instinto Selvagem'],[9,'Crítico Brutal'],[11,'Fúria Implacável'],[15,'Fúria Persistente'],
  [18,'Força Indomável'],[20,'Campeão Primal e Fúrias ilimitadas'],
 ]),
 'Bardo': lista([
  [1,'Inspiração de Bardo',true],[1,'Conjuração — magias conhecidas'],
  [2,'Pau para Toda Obra',true],[2,'Canção de Descanso'],[3,'Colégio de Bardo (subclasse)'],
  [3,'Especialização'],[5,'Fonte de Inspiração'],[6,'Contrafeitiço — Contracanto'],
  [10,'Segredos Mágicos'],[20,'Inspiração Superior'],
 ]),
 'Clérigo': lista([
  [1,'Conjuração'],[1,'Domínio Divino (subclasse)'],[2,'Canalizar Divindade',true],
  [5,'Destruir Mortos-Vivos'],[10,'Intervenção Divina'],[20,'Intervenção Divina Aprimorada'],
 ]),
 'Druida': lista([
  [1,'Druídico e Conjuração'],[2,'Forma Selvagem',true],[2,'Círculo Druídico (subclasse)'],
  [18,'Corpo Atemporal'],[18,'Magias da Besta'],[20,'Arquidruida'],
 ]),
 'Guerreiro': lista([
  [1,'Estilo de Luta (escolha)'],[1,'Retomar o Fôlego',true],[2,'Surto de Ação',true],
  [3,'Arquétipo Marcial (subclasse)'],[5,'Ataque Extra'],[9,'Indomável',true],
  [11,'Ataque Extra (2)'],[17,'Surto de Ação (2)',true],[20,'Ataque Extra (3)'],
 ]),
 'Monge': lista([
  [1,'Defesa sem Armadura',true],[1,'Artes Marciais'],[2,'Ki e técnicas',true],
  [2,'Movimento sem Armadura',true],[3,'Tradição Monástica (subclasse)'],[3,'Desviar Projéteis'],
  [5,'Ataque Extra'],[5,'Ataque Atordoante'],[7,'Evasão'],[14,'Alma de Diamante'],[20,'Eu Perfeito'],
 ]),
 'Paladino': lista([
  [1,'Sentido Divino'],[1,'Cura pelas Mãos',true],[2,'Estilo de Luta (escolha)'],[2,'Conjuração'],
  [2,'Destruição Divina'],[3,'Juramento Sagrado (subclasse)'],[5,'Ataque Extra'],
  [6,'Aura de Proteção'],[10,'Aura de Coragem'],[11,'Destruição Divina Aprimorada'],[14,'Toque Purificador'],
 ]),
 'Patrulheiro': lista([
  [1,'Inimigo Favorito (escolha)'],[1,'Explorador Natural (escolha)'],[2,'Estilo de Luta (escolha)'],
  [2,'Conjuração'],[3,'Arquétipo de Patrulheiro (subclasse)'],[3,'Consciência Primeva'],
  [5,'Ataque Extra'],[8,'Passo da Terra'],[10,'Esconder-se à Vista'],[14,'Desaparecer'],
  [18,'Sentidos Selvagens'],[20,'Matador de Inimigos'],
 ]),
 'Ladino': lista([
  [1,'Especialização (escolha)'],[1,'Ataque Furtivo',true],[1,'Gíria dos Ladrões'],
  [2,'Ação Ardilosa'],[3,'Arquétipo de Ladino (subclasse)'],[5,'Esquiva Sobrenatural'],
  [7,'Evasão'],[11,'Talento Confiável'],[14,'Sentido Cego'],[15,'Mente Escorregadia'],
  [18,'Elusivo'],[20,'Golpe de Sorte'],
 ]),
 'Feiticeiro': lista([
  [1,'Conjuração'],[1,'Origem Feiticeira (subclasse)'],[2,'Fonte de Magia',true],
  [3,'Metamagia (escolha)'],[20,'Restauração Feiticeira'],
 ]),
 'Bruxo': lista([
  [1,'Patrono de Outro Mundo (subclasse)'],[1,'Magia de Pacto',true],
  [2,'Invocações Místicas (escolhas)'],[3,'Dádiva do Pacto (escolha)'],
  [11,'Arcana Mística'],[20,'Mestre Místico'],
 ]),
 'Mago': lista([
  [1,'Conjuração e Grimório'],[1,'Recuperação Arcana'],[2,'Tradição Arcana (subclasse)'],
  [18,'Maestria em Magia'],[20,'Magias de Assinatura'],
 ]),
}
export const marcosDaClasse2014 = (classe: unknown): MarcoClasse2014[] =>
  typeof classe === 'string' ? MARCOS_CLASSES_2014[classe] ?? [] : []
