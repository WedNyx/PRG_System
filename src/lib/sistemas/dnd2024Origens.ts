/**
 * D&D 2024 — espécies e antecedentes do SRD 5.2.1 como marcos da progressão (nomes e resumos em português).
 * Este trabalho inclui material do System Reference Document 5.2.1 ("SRD 5.2.1") da Wizards of the Coast LLC,
 * disponível em https://www.dndbeyond.com/srd, licenciado sob CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode).
 * Os `origemId` são o nome da opção da ficha sem acento (Anão → anao, Acólito → acolito).
 */
import type { MarcoDnd } from './dnd2024Progressao'

const FONTE = 'SRD 5.2.1 (CC BY 4.0)'
type Linha = [nivel: number, codigo: string, nome: string, descricao: string, opcoes?: [string, string][]]

const TALENTOS_ORIGEM: [string, string][] = [['alerta', 'Alerta'], ['iniciado-magia', 'Iniciado em Magia'], ['atacante-selvagem', 'Atacante Selvagem'], ['habilidoso', 'Habilidoso']]
/** O SRD permite definir o atributo de conjuração destes legados/linhagens ao escolher a espécie. */
const ATRIBUTO_MAGIA: [string, string][] = [['inteligencia', 'Inteligência'], ['sabedoria', 'Sabedoria'], ['carisma', 'Carisma']]
const TAMANHO_FLEXIVEL: [string, string][] = [['pequeno', 'Pequeno'], ['medio', 'Médio']]
const PERICIAS_HUMANO: [string, string][] = [
  ['acrobacia', 'Acrobacia'], ['adestrar_animais', 'Adestrar Animais'], ['arcanismo', 'Arcanismo'],
  ['atletismo', 'Atletismo'], ['atuacao', 'Atuação'], ['enganacao', 'Enganação'],
  ['furtividade', 'Furtividade'], ['historia', 'História'], ['intimidacao', 'Intimidação'],
  ['intuicao', 'Intuição'], ['investigacao', 'Investigação'], ['medicina', 'Medicina'],
  ['natureza', 'Natureza'], ['percepcao', 'Percepção'], ['persuasao', 'Persuasão'],
  ['prestidigitacao', 'Prestidigitação'], ['religiao', 'Religião'], ['sobrevivencia', 'Sobrevivência'],
]

const ESPECIES: Record<string, Linha[]> = {
  anao: [
    [1, 'visao-escuro', 'Visão no Escuro (36 m)', 'Enxerga na penumbra como na luz plena e no escuro como na penumbra, até 36 m.'],
    [1, 'resiliencia', 'Resiliência Anã', 'Resistência a dano de veneno e vantagem em salvaguardas contra Envenenado.'],
    [1, 'robustez', 'Robustez Anã', '+1 PV máximo, e mais +1 a cada nível (a ficha já soma).'],
    [1, 'conhecimento-pedra', 'Conhecimento de Pedra', 'Ação Bônus: sentido sísmico de 18 m por 10 minutos tocando pedra (usos = proficiência por descanso longo).'],
  ],
  draconato: [
    [1, 'ancestral', 'Ancestral Dracônico', 'Define o tipo de dano do Sopro e da Resistência.', [['preto', 'Preto (ácido)'], ['azul', 'Azul (elétrico)'], ['latao', 'Latão (fogo)'], ['bronze', 'Bronze (elétrico)'], ['cobre', 'Cobre (ácido)'], ['ouro', 'Ouro (fogo)'], ['verde', 'Verde (veneno)'], ['vermelho', 'Vermelho (fogo)'], ['prata', 'Prata (frio)'], ['branco', 'Branco (frio)']]],
    [1, 'sopro', 'Arma de Sopro', 'No lugar de um ataque: cone de 4,5 m ou linha de 9 m; salvaguarda de Destreza (CD 8 + Con + proficiência), 1d10 (cresce nos níveis 5, 11 e 17). Usos = proficiência por descanso longo.'],
    [1, 'resistencia', 'Resistência a Dano', 'Resistência ao tipo de dano do seu ancestral.'],
    [1, 'visao-escuro', 'Visão no Escuro (18 m)', 'Enxerga no escuro até 18 m.'],
    [5, 'voo', 'Voo Dracônico', 'Ação Bônus: asas espectrais com deslocamento de voo por 10 minutos (uma vez por descanso longo).'],
  ],
  elfo: [
    [1, 'visao-escuro', 'Visão no Escuro (18 m)', 'Enxerga no escuro até 18 m (Drow: 36 m).'],
    [1, 'linhagem', 'Linhagem Élfica', 'Benefício do nível 1 e magias nos níveis 3 e 5, conjuradas uma vez sem espaço por descanso longo.', [['drow', 'Drow (Globos de Luz; Fogo das Fadas; Escuridão)'], ['alto-elfo', 'Alto Elfo (Prestidigitação; Detectar Magia; Passo Nebuloso)'], ['elfo-floresta', 'Elfo da Floresta (+1,5 m, Arte Druídica; Passos Longos; Passos sem Pegadas)']]],
    [1, 'atributo-magia', 'Atributo de conjuração da Linhagem Élfica', 'Escolha Inteligência, Sabedoria ou Carisma para as magias da linhagem. O valor escolhido deve ser usado nas magias concedidas pela espécie.', ATRIBUTO_MAGIA],
    [1, 'ancestralidade-feerica', 'Ancestralidade Feérica', 'Vantagem em salvaguardas contra Enfeitiçado.'],
    [1, 'sentidos', 'Sentidos Aguçados', 'Proficiência em uma perícia.', [['intuicao', 'Intuição'], ['percepcao', 'Percepção'], ['sobrevivencia', 'Sobrevivência']]],
    [1, 'transe', 'Transe', 'Não precisa dormir e faz o descanso longo em 4 horas de meditação.'],
    [3, 'linhagem-3', 'Magia da Linhagem (nível 3)', 'A magia de nível 3 da sua linhagem fica sempre preparada.'],
    [5, 'linhagem-5', 'Magia da Linhagem (nível 5)', 'A magia de nível 5 da sua linhagem fica sempre preparada.'],
  ],
  gnomo: [
    [1, 'visao-escuro', 'Visão no Escuro (18 m)', 'Enxerga no escuro até 18 m.'],
    [1, 'atributo-magia', 'Atributo de conjuração da Linhagem Gnômica', 'Escolha Inteligência, Sabedoria ou Carisma para conjurar as magias da linhagem gnômica.', ATRIBUTO_MAGIA],
    [1, 'astucia', 'Astúcia Gnômica', 'Vantagem em salvaguardas de Inteligência, Sabedoria e Carisma.'],
    [1, 'linhagem', 'Linhagem Gnômica', 'Magias da linhagem (Inteligência, Sabedoria ou Carisma para conjurar).', [['floresta', 'Gnomo da Floresta (Ilusão Menor; Falar com Animais)'], ['rochas', 'Gnomo das Rochas (Consertar e Prestidigitação; engenhocas)']]],
  ],
  golias: [
    [1, 'ancestralidade', 'Ancestralidade Gigante', 'Um benefício do seu ancestral gigante (usos = proficiência por descanso longo).', [['nuvem', 'Nuvem: Teleporte de 9 m'], ['fogo', 'Fogo: +1d10 de fogo ao acertar'], ['gelo', 'Gelo: +1d6 de frio e −3 m de deslocamento'], ['colina', 'Colina: derrubar ao acertar'], ['pedra', 'Pedra: reduz dano em 1d12 + Con'], ['tempestade', 'Tempestade: 1d8 trovejante em quem te ferir']]],
    [1, 'constituicao', 'Constituição Poderosa', 'Vantagem para escapar de agarrão e conta como um tamanho maior para carga.'],
    [5, 'forma-grande', 'Forma Grande', 'Ação Bônus: fica Grande por 10 minutos (vantagem em Força e +3 m de deslocamento), uma vez por descanso longo.'],
  ],
  halfling: [
    [1, 'corajoso', 'Corajoso', 'Vantagem em salvaguardas contra Amedrontado.'],
    [1, 'agilidade', 'Agilidade Halfling', 'Atravessa o espaço de criaturas maiores (sem parar nele).'],
    [1, 'sorte', 'Sorte', 'Ao tirar 1 no d20 de um Teste de D20, rola de novo e fica com o novo resultado.'],
    [1, 'furtividade', 'Furtividade Natural', 'Pode Esconder atrás de uma criatura pelo menos um tamanho maior.'],
  ],
  humano: [
    [1, 'tamanho', 'Tamanho', 'Escolha Pequeno ou Médio ao criar o personagem.', TAMANHO_FLEXIVEL],
    [1, 'engenhoso', 'Engenhoso', 'Ganha Inspiração Heroica ao terminar um descanso longo.'],
    [1, 'habilidoso', 'Habilidoso', 'Proficiência em uma perícia à escolha.', PERICIAS_HUMANO],
    [1, 'versatil', 'Versátil', 'Um talento de origem à escolha (Habilidoso é o recomendado).', TALENTOS_ORIGEM],
  ],
  orc: [
    [1, 'adrenalina', 'Pico de Adrenalina', 'Ação Bônus de Disparada com PV temporários = proficiência (usos = proficiência por descanso curto ou longo).'],
    [1, 'visao-escuro', 'Visão no Escuro (36 m)', 'Enxerga no escuro até 36 m.'],
    [1, 'resistencia-implacavel', 'Resistência Implacável', 'Ao cair a 0 PV sem morrer, fica com 1 PV (uma vez por descanso longo).'],
  ],
  tiferino: [
    [1, 'tamanho', 'Tamanho', 'Escolha Pequeno ou Médio ao criar o personagem.', TAMANHO_FLEXIVEL],
    [1, 'atributo-magia', 'Atributo de conjuração do Legado Ínfero', 'Escolha Inteligência, Sabedoria ou Carisma para as magias do legado e o truque Taumaturgia.', ATRIBUTO_MAGIA],
    [1, 'visao-escuro', 'Visão no Escuro (18 m)', 'Enxerga no escuro até 18 m.'],
    [1, 'legado', 'Legado Ínfero', 'Resistência e truque do nível 1; magias nos níveis 3 e 5, uma vez sem espaço por descanso longo.', [['abissal', 'Abissal (veneno; Spray Venenoso; Raio Nauseante; Imobilizar Pessoa)'], ['ctonico', 'Ctônico (necrótico; Toque Arrepiante; Vida Falsa; Raio do Enfraquecimento)'], ['infernal', 'Infernal (fogo; Raio de Fogo; Repreensão Infernal; Escuridão)']]],
    [1, 'presenca', 'Presença Sobrenatural', 'Conhece o truque Taumaturgia.'],
    [3, 'legado-3', 'Magia do Legado (nível 3)', 'A magia de nível 3 do seu legado fica sempre preparada.'],
    [5, 'legado-5', 'Magia do Legado (nível 5)', 'A magia de nível 5 do seu legado fica sempre preparada.'],
  ],
}

/** Antecedentes do SRD 5.2.1: atributos, talento de origem, perícias, ferramenta e equipamento. */
const ANTECEDENTES: Record<string, Linha[]> = {
  acolito: [
    [1, 'atributos', 'Atributos do antecedente', 'Inteligência, Sabedoria e Carisma: +2 num e +1 noutro, ou +1 nos três (máximo 20).'],
    [1, 'talento', 'Talento de origem: Iniciado em Magia (Clérigo)', 'Dois truques e uma magia de nível 1 da lista de Clérigo.'],
    [1, 'pericias', 'Perícias: Intuição e Religião', 'Proficiência em Intuição e Religião.'],
    [1, 'ferramenta', 'Ferramenta: Suprimentos de Caligrafia', 'Proficiência com Suprimentos de Caligrafia.'],
    [1, 'equipamento', 'Equipamento inicial', '(A) Suprimentos de Caligrafia, livro de orações, símbolo sagrado, 10 folhas de pergaminho, túnica e 8 PO; ou (B) 50 PO.'],
  ],
  criminoso: [
    [1, 'atributos', 'Atributos do antecedente', 'Destreza, Constituição e Inteligência: +2 num e +1 noutro, ou +1 nos três (máximo 20).'],
    [1, 'talento', 'Talento de origem: Alerta', 'Soma a proficiência à Iniciativa e pode trocar de Iniciativa com um aliado.'],
    [1, 'pericias', 'Perícias: Prestidigitação e Furtividade', 'Proficiência em Prestidigitação e Furtividade.'],
    [1, 'ferramenta', 'Ferramenta: Ferramentas de Ladrão', 'Proficiência com Ferramentas de Ladrão.'],
    [1, 'equipamento', 'Equipamento inicial', '(A) 2 adagas, Ferramentas de Ladrão, pé de cabra, 2 bolsas, roupas de viajante e 16 PO; ou (B) 50 PO.'],
  ],
  sabio: [
    [1, 'atributos', 'Atributos do antecedente', 'Constituição, Inteligência e Sabedoria: +2 num e +1 noutro, ou +1 nos três (máximo 20).'],
    [1, 'talento', 'Talento de origem: Iniciado em Magia (Mago)', 'Dois truques e uma magia de nível 1 da lista de Mago.'],
    [1, 'pericias', 'Perícias: Arcanismo e História', 'Proficiência em Arcanismo e História.'],
    [1, 'ferramenta', 'Ferramenta: Suprimentos de Caligrafia', 'Proficiência com Suprimentos de Caligrafia.'],
    [1, 'equipamento', 'Equipamento inicial', '(A) Bordão, Suprimentos de Caligrafia, livro de história, 8 folhas de pergaminho, túnica e 8 PO; ou (B) 50 PO.'],
  ],
  soldado: [
    [1, 'atributos', 'Atributos do antecedente', 'Força, Destreza e Constituição: +2 num e +1 noutro, ou +1 nos três (máximo 20).'],
    [1, 'talento', 'Talento de origem: Atacante Selvagem', 'Uma vez por turno, rola o dano da arma duas vezes e fica com o melhor.'],
    [1, 'pericias', 'Perícias: Atletismo e Intimidação', 'Proficiência em Atletismo e Intimidação.'],
    [1, 'ferramenta', 'Ferramenta: um tipo de jogo', 'Proficiência com um tipo de Kit de Jogos à escolha.'],
    [1, 'equipamento', 'Equipamento inicial', '(A) Lança, arco curto, 20 flechas, kit de jogos, kit de curandeiro, aljava, roupas de viajante e 14 PO; ou (B) 50 PO.'],
  ],
}

const virar = (origem: 'especie' | 'antecedente', tabela: Record<string, Linha[]>): MarcoDnd[] =>
  Object.entries(tabela).flatMap(([origemId, linhas]) => linhas.map(([nivel, codigo, nome, descricao, opcoes]) => ({
    id: `${origem === 'especie' ? 'esp' : 'ant'}-${origemId}-${codigo}`, nome, nivel, origem, origemId, descricao, fonte: FONTE,
    ...(opcoes ? { modo: 'escolha' as const, opcoes: opcoes.map(([id, n]) => ({ id, nome: n })) } : { modo: 'automatico' as const }),
  })))

export const MARCOS_ORIGENS_SRD: MarcoDnd[] = [...virar('especie', ESPECIES), ...virar('antecedente', ANTECEDENTES)]
