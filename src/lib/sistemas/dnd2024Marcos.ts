import type { MarcoDnd } from './dnd2024Progressao'

/**
 * Marcos de características de classe: Fighter, Rogue e Wizard, níveis 1–20.
 *
 * Fonte de regras abertas: System Reference Document 5.2.1, Wizards of the Coast LLC
 * https://www.dndbeyond.com/srd — CC BY 4.0
 * https://creativecommons.org/licenses/by/4.0/
 * Conferência das tabelas: https://www.dndbeyond.com/sources/dnd/br-2024/character-classes
 *
 * IMPORTANTE: este catálogo é VISUAL, não aplica automaticamente o efeito de
 * características ou talentos. Subclasse e talentos só podem ser automatizados
 * depois da implementação e validação individual da opção.
 *
 * Por enquanto cobre características de Guerreiro, Ladino e Mago, e oferece
 * a escolha inicial de uma subclasse aberta do SRD para cada uma das 12 classes.
 * As demais características de classe ainda não estão catalogadas nesta etapa.
 */
type Linha = readonly [nivel: number, codigo: string, nome: string, descricao?: string]

const FONTE = 'SRD 5.2.1 (CC BY 4.0)'
const MARCO_SUBCLASSE = 'Referência à progressão da subclasse escolhida. Consulte as características específicas no SRD; os efeitos não são aplicados pela árvore.'
const MARCO_TALENTO = 'Este nível dá direito à escolha de um talento elegível; o seletor de talentos ainda será desenvolvido. Não se considera a escolha automaticamente concluída.'
const subclasse = (idClasse: string, nome: string, opcaoId: string, opcao: string): MarcoDnd =>
  ({
    id: idClasse + '-subclasse', nome: 'Escolher subclasse de ' + nome,
    nivel: 3, origem: 'subclasse', origemId: idClasse, modo: 'escolha',
    opcoes: [{ id: opcaoId, nome: opcao + ' (SRD)' }],
    fonte: FONTE,
    descricao: 'Por ora apenas a opção aberta do SRD está cadastrada. Outras subclasses do Livro do Jogador 2024 dependem de integração autorizada.'
  })
const marco = (classe: string, [nivel, codigo, nome, descricao]: Linha): MarcoDnd => ({
  id: classe + '-' + codigo, nome, nivel, origem: 'classe', origemId: classe,
  modo: 'automatico', fonte: FONTE, ...(descricao ? { descricao } : {})
})
const evolucaoSubclasse = (classe: string, niveis: number[]): MarcoDnd[] =>
  niveis.map(nivel => marco(classe, [nivel, 'subclasse-n' + nivel, 'Característica de subclasse', MARCO_SUBCLASSE]))
const talentos = (classe: string, niveis: number[]): MarcoDnd[] =>
  niveis.map(nivel => marco(classe, [nivel, 'talento-n' + nivel, nivel === 19 ? 'Benefício Épico / talento' : 'Aumento de atributo / talento', MARCO_TALENTO]))

// Tabela "Fighter Features" do D&D Free Rules 2024/SRD 5.2.1.
const GUERREIRO: Linha[] = [
  [1, 'estilo-luta', 'Estilo de Luta', 'Escolha de um talento de Estilo de Luta; opções completas ainda não implementadas.'],
  [1, 'segundo-folego', 'Segundo Fôlego', 'Recurso de recuperação de PV. Usos aumentam conforme o nível; ver tabela de classe.'],
  [1, 'maestria-armas', 'Maestria em Armas', 'Escolha armas cujas propriedades de maestria sabe usar.'],
  [2, 'surto-acao', 'Surto de Ação', 'Ação adicional com restrições da característica; número de usos aumenta no nível 17.'],
  [2, 'mente-tatica', 'Mente Tática'],
  [5, 'ataque-extra', 'Ataque Extra'],
  [5, 'mudanca-tatica', 'Mudança Tática'],
  [9, 'indomavel-1', 'Indomável (1 uso)'],
  [9, 'mestre-tatico', 'Mestre Tático'],
  [11, 'dois-ataques-extra', 'Dois Ataques Extras'],
  [13, 'indomavel-2', 'Indomável (2 usos)'],
  [13, 'ataques-estudados', 'Ataques Estudados'],
  [17, 'surto-acao-2', 'Surto de Ação (2 usos)'],
  [17, 'indomavel-3', 'Indomável (3 usos)'],
  [20, 'tres-ataques-extra', 'Três Ataques Extras'],
]
// Tabela "Rogue Features".
const LADINO: Linha[] = [
  [1, 'especializacao-1', 'Especialização (Expertise)', 'Escolha perícias elegíveis; seleção ainda não automatizada.'],
  [1, 'ataque-furtivo', 'Ataque Furtivo', 'O dano em d6 cresce com o nível de Ladino; consultar tabela de classe.'],
  [1, 'girias-ladroes', 'Gíria dos Ladrões (Thieves’ Cant)'],
  [1, 'maestria-armas', 'Maestria em Armas'],
  [2, 'acao-astuta', 'Ação Astuta'],
  [3, 'mira-estavel', 'Mira Estável'],
  [5, 'golpe-astuto', 'Golpe Astuto'],
  [5, 'esquiva-sobrenatural', 'Esquiva Sobrenatural'],
  [6, 'especializacao-2', 'Especialização adicional', 'Escolha mais duas perícias elegíveis; seleção ainda não automatizada.'],
  [7, 'evasao', 'Evasão'],
  [7, 'talento-confiavel', 'Talento Confiável'],
  [11, 'golpe-astuto-aprimorado', 'Golpe Astuto Aprimorado'],
  [14, 'golpes-ardilosos', 'Golpes Ardilosos'],
  [15, 'mente-escorregadia', 'Mente Escorregadia'],
  [18, 'evasivo', 'Evasivo'],
  [20, 'golpe-de-sorte', 'Golpe de Sorte'],
]
// Tabela "Wizard Features". Níveis sem característica nomeada ainda concedem
// progressão de magias, a ser modelada em tabela separada de slots/preparo.
const MAGO: Linha[] = [
  [1, 'conjuracao', 'Conjuração', 'Seleção e preparação de magias ainda serão integradas ao catálogo de magias.'],
  [1, 'adepto-ritual', 'Adepto em Rituais'],
  [1, 'recuperacao-arcana', 'Recuperação Arcana'],
  [2, 'estudioso', 'Estudioso'],
  [5, 'memorizar-magia', 'Memorizar Magia'],
  [18, 'maestria-magia', 'Maestria em Magia'],
  [20, 'magias-assinatura', 'Magias de Assinatura'],
]

export const MARCOS_DND_2024: MarcoDnd[] = [
  // As doze opções abertas de subclasse de 2024 (uma por classe no SRD).
  // Nesta fase são apenas decisões registráveis, sem aplicar efeitos.
  subclasse('barbaro', 'Bárbaro', 'berserker', 'Berserker'),
  subclasse('bardo', 'Bardo', 'colegio-conhecimento', 'College of Lore'),
  subclasse('bruxo', 'Bruxo', 'patrono-infernal', 'Fiend Patron'),
  subclasse('clerigo', 'Clérigo', 'dominio-vida', 'Life Domain'),
  subclasse('druida', 'Druida', 'circulo-terra', 'Circle of the Land'),
  subclasse('feiticeiro', 'Feiticeiro', 'feiticaria-draconica', 'Draconic Sorcery'),
  subclasse('monge', 'Monge', 'mao-aberta', 'Warrior of the Open Hand'),
  subclasse('paladino', 'Paladino', 'juramento-devocao', 'Oath of Devotion'),
  subclasse('patrulheiro', 'Patrulheiro', 'cacador', 'Hunter'),
  ...GUERREIRO.map(l => marco('guerreiro', l)),
  subclasse('guerreiro', 'Guerreiro', 'campeao', 'Campeão'),
  ...evolucaoSubclasse('guerreiro', [7, 10, 15, 18]),
  ...talentos('guerreiro', [4, 6, 8, 12, 14, 16, 19]),
  ...LADINO.map(l => marco('ladino', l)),
  subclasse('ladino', 'Ladino', 'ladrao', 'Ladrão'),
  ...evolucaoSubclasse('ladino', [9, 13, 17]),
  ...talentos('ladino', [4, 8, 10, 12, 16, 19]),
  ...MAGO.map(l => marco('mago', l)),
  subclasse('mago', 'Mago', 'evocador', 'Evocador'),
  ...evolucaoSubclasse('mago', [6, 10, 14]),
  ...talentos('mago', [4, 8, 12, 16, 19]),
]
