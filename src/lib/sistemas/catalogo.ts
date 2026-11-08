import type { PericiaDef, Sistema } from './tipos'

/*
 * Catálogo de sistemas. Regras de sistemas com licença aberta usam apenas o que a
 * licença permite (com os créditos exigidos). Sistemas comerciais sem licença aberta
 * entram só como ESTRUTURA de ficha (nomes de campos), sem textos dos livros.
 */

const p = (lista: [string, string, string?][]): PericiaDef[] =>
  lista.map(([nome, atributo, grupo]) => ({
    id: nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    nome, atributo: atributo || undefined, grupo,
  }))

const LISTAS_PADRAO = [
  { id: 'habilidades', nome: 'Habilidades e poderes' },
  { id: 'inventario', nome: 'Inventário' },
  { id: 'anotacoes', nome: 'Anotações e história' },
]
const ATR6 = (min: number, max: number, padrao: number) => ([
  ['FOR', 'Força'], ['DES', 'Destreza'], ['CON', 'Constituição'], ['INT', 'Inteligência'], ['SAB', 'Sabedoria'], ['CAR', 'Carisma'],
] as const).map(([id, nome]) => ({ id, nome, min, max, padrao }))

// Nível pela tabela provisória de XP de Lunethernnyis (0/300/750/1350/2100/3000/4050/5250/6600/8100).
const NIVEL_LUNE = [300, 750, 1350, 2100, 3000, 4050, 5250, 6600, 8100].map(x => `min(1, max(0, piso((xp - ${x} + 1000000) / 1000000)))`).join(' + ')

export const SISTEMAS: Sistema[] = [
  {
    id: 'lunethernnyis',
    nome: 'Lunethernnyis — Opositores (ficha automática)',
    resumo: 'Seu sistema autoral, com as regras APROVADAS automatizadas: pontos de atributo, limites por nível, perícias, PV, Defesa e XP.',
    tipo: 'autoral', licenca: 'Sistema autoral do PRG System', dados: 'd20',
    campos: [
      { id: 'jogador', nome: 'Jogador', tipo: 'texto' },
      { id: 'conceito', nome: 'Conceito', tipo: 'texto' },
      { id: 'xp', nome: 'XP total', tipo: 'numero', padrao: 0 },
    ],
    atributos: [['POT', 'Potência'], ['DES', 'Destreza'], ['REF', 'Reflexo'], ['TEN', 'Tenacidade'], ['ENG', 'Engenho'], ['VON', 'Vontade'], ['SIN', 'Sintonia']]
      .map(([id, nome]) => ({ id, nome, min: 0, max: 5, padrao: 1 })),
    derivados: [
      { id: 'nivel', nome: 'Nível', formula: '1 + ' + NIVEL_LUNE, dica: 'Pela tabela de XP provisória' },
      { id: 'pv_max', nome: 'PV máximos', formula: '25 + TEN * 5' },
      { id: 'defesa', nome: 'Defesa Passiva', formula: '10 + REF', dica: '+ modificadores (armadura, barreiras, formas)' },
      { id: 'iniciativa', nome: 'Iniciativa (proposta)', formula: 'REF', dica: '1d20 + REF — proposta para teste' },
      { id: 'limite_atributo', nome: 'Limite de atributo', formula: '3 + min(1, max(0, nivel - 3)) + min(1, max(0, nivel - 7))' },
    ],
    pericias: {
      modo: 'treino', total: 'TREINO',
      treinos: [
        { id: 'iniciante', nome: 'Iniciante (+0)', formula: '0', custo: 0 },
        { id: 'praticante', nome: 'Praticante (+3)', formula: '3', custo: 1 },
        { id: 'experiente', nome: 'Experiente (+6)', formula: '6', custo: 3 },
        { id: 'eximio', nome: 'Exímio (+9)', formula: '9', custo: 6 },
      ],
      lista: p([
        ['Confronto', 'POT', 'Combate'], ['Pontaria', 'DES', 'Combate'], ['Guarda', 'REF', 'Combate'], ['Estratégia', 'ENG', 'Combate'],
        ['Atletismo', 'POT', 'Corpo e movimento'], ['Acrobacia', 'DES', 'Corpo e movimento'], ['Furtividade', 'DES', 'Corpo e movimento'], ['Evasão', 'DES', 'Corpo e movimento'],
        ['Investigação', 'ENG', 'Conhecimento e investigação'], ['Tecnologia', 'ENG', 'Conhecimento e investigação'], ['Medicina', 'ENG', 'Conhecimento e investigação'], ['Erudição', 'ENG', 'Conhecimento e investigação'],
        ['Diplomacia', 'VON', 'Interação social'], ['Intimidação', 'VON', 'Interação social'], ['Enganação', 'ENG', 'Interação social'], ['Expressão', 'VON', 'Interação social'],
        ['Canalização', 'SIN', 'Poderes extraordinários'], ['Domínio', 'SIN', 'Poderes extraordinários'], ['Sensibilidade', 'SIN', 'Poderes extraordinários'], ['Ocultismo', 'ENG', 'Poderes extraordinários'],
        ['Percepção', '', 'Exploração e sobrevivência'], ['Rastreamento', 'ENG', 'Exploração e sobrevivência'], ['Sobrevivência', 'TEN', 'Exploração e sobrevivência'], ['Ofício', 'DES', 'Exploração e sobrevivência'],
      ]),
    },
    recursos: [
      { id: 'pv', nome: 'PV', formula: 'pv_max' },
      { id: 'esquivas', nome: 'Esquivas Ativas (rodada)', maxFixo: 2 },
      { id: 'guarda', nome: 'Guarda Ativa (rodada)', maxFixo: 1 },
      { id: 'reacao', nome: 'Reação (rodada)', maxFixo: 1 },
    ],
    limites: [
      { nome: 'Pontos de atributo (criação)', uso: 'soma_atributos - 7', max: '6 + min(1, atributos_zero)' },
      { nome: 'Atributos em 0', uso: 'atributos_zero', max: '1' },
      { nome: 'Maior atributo', uso: 'maior_atributo', max: 'limite_atributo' },
      { nome: 'Pontos de perícia (criação)', uso: 'custo_pericias', max: '8' },
      { nome: 'Perícias Exímias (criação)', uso: 'qtd_eximio', max: '1' },
    ],
    listas: [{ id: 'tecnicas', nome: 'Técnicas e poderes' }, { id: 'transformacoes', nome: 'Transformações' }, ...LISTAS_PADRAO.slice(1), { id: 'ferimentos', nome: 'Ferimentos e condições' }],
    observacoes: [
      'Teste: 1d20 + atributo + treinamento + modificadores contra a DT (8 a 32). 20 natural = Sucesso Crítico; 1 natural = Falha Crítica.',
      'Morrendo a 0 PV: no início do turno, 1d20 + TEN contra DT 12. Três sucessos estabilizam; três falhas, morte.',
      'Guarda sofre −2 por Esquiva já tentada na rodada (até −4). Uma defesa ativa por ataque.',
      'Ainda configuráveis (não aprovados): ferimentos, Medicina, críticos ofensivos, dano, deslocamento, XP por sessão.',
    ],
  },
  {
    id: 'dnd5e-srd',
    nome: 'D&D 5ª edição (SRD 5.2)',
    resumo: 'O RPG de fantasia mais jogado do mundo. Ficha com atributos, modificadores, proficiência, perícias e salvaguardas calculados.',
    tipo: 'aberto', licenca: 'CC-BY-4.0',
    creditos: 'Este trabalho inclui material do System Reference Document 5.2 ("SRD 5.2") da Wizards of the Coast LLC, disponível em https://www.dndbeyond.com/srd. O SRD 5.2 está licenciado sob a Creative Commons Attribution 4.0 International License (https://creativecommons.org/licenses/by/4.0/legalcode).',
    dados: 'd20 (dano: d4–d12)',
    campos: [
      { id: 'classe', nome: 'Classe', tipo: 'texto' }, { id: 'especie', nome: 'Espécie', tipo: 'texto' },
      { id: 'antecedente', nome: 'Antecedente', tipo: 'texto' }, { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 },
      { id: 'armadura', nome: 'Bônus de armadura/escudo', tipo: 'numero', padrao: 0 }, { id: 'deslocamento', nome: 'Deslocamento (m)', tipo: 'numero', padrao: 9 },
    ],
    atributos: ATR6(1, 30, 10),
    formulaModificador: 'piso((X - 10) / 2)',
    derivados: [
      { id: 'prof', nome: 'Bônus de proficiência', formula: 'piso((max(1, nivel) - 1) / 4) + 2' },
      { id: 'ca', nome: 'Classe de Armadura (sem armadura)', formula: '10 + mod_DES + armadura', dica: 'Armaduras podem limitar a Destreza' },
      { id: 'iniciativa', nome: 'Iniciativa', formula: 'mod_DES' },
      { id: 'percepcao_passiva', nome: 'Percepção passiva', formula: '10 + tot_percepcao' },
    ],
    pericias: {
      modo: 'treino', total: 'MOD + TREINO',
      treinos: [
        { id: 'nenhum', nome: '—', formula: '0' }, { id: 'proficiente', nome: 'Proficiente', formula: 'prof' },
        { id: 'especialista', nome: 'Especialista', formula: 'prof * 2' },
      ],
      lista: [
        ...p([['Força', 'FOR', 'Salvaguardas'], ['Destreza', 'DES', 'Salvaguardas'], ['Constituição', 'CON', 'Salvaguardas'], ['Inteligência', 'INT', 'Salvaguardas'], ['Sabedoria', 'SAB', 'Salvaguardas'], ['Carisma', 'CAR', 'Salvaguardas']]).map(x => ({ ...x, id: 'resist_' + x.id })),
        ...p([['Acrobacia', 'DES', 'Perícias'], ['Adestrar Animais', 'SAB', 'Perícias'], ['Arcanismo', 'INT', 'Perícias'], ['Atletismo', 'FOR', 'Perícias'], ['Atuação', 'CAR', 'Perícias'], ['Enganação', 'CAR', 'Perícias'], ['Furtividade', 'DES', 'Perícias'], ['História', 'INT', 'Perícias'], ['Intimidação', 'CAR', 'Perícias'], ['Intuição', 'SAB', 'Perícias'], ['Investigação', 'INT', 'Perícias'], ['Medicina', 'SAB', 'Perícias'], ['Natureza', 'INT', 'Perícias'], ['Percepção', 'SAB', 'Perícias'], ['Persuasão', 'CAR', 'Perícias'], ['Prestidigitação', 'DES', 'Perícias'], ['Religião', 'INT', 'Perícias'], ['Sobrevivência', 'SAB', 'Perícias']]),
      ],
    },
    recursos: [{ id: 'pv', nome: 'Pontos de Vida' }, { id: 'pv_temp', nome: 'PV temporários' }, { id: 'dados_vida', nome: 'Dados de Vida', formula: 'max(1, nivel)' }],
    limites: [{ nome: 'Atributos acima de 20 (só com magia/itens)', uso: 'maior_atributo', max: '20' }],
    listas: [{ id: 'ataques', nome: 'Ataques e magias' }, { id: 'tracos', nome: 'Traços e talentos' }, ...LISTAS_PADRAO.slice(1)],
  },
  {
    id: 'pf2e',
    nome: 'Pathfinder 2ª edição (Remaster)',
    resumo: 'Fantasia tática com graus de proficiência que crescem com o nível. Perícias, salvamentos e Percepção calculados.',
    tipo: 'aberto', licenca: 'ORC License',
    creditos: 'Pathfinder Second Edition Remaster (Player Core e GM Core), Paizo Inc. Mecânicas usadas sob a ORC License (Open RPG Creative License). Pathfinder é marca da Paizo Inc.; este site não é afiliado à Paizo.',
    dados: 'd20',
    campos: [
      { id: 'ancestralidade', nome: 'Ancestralidade', tipo: 'texto' }, { id: 'classe', nome: 'Classe', tipo: 'texto' },
      { id: 'antecedente', nome: 'Antecedente', tipo: 'texto' }, { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 },
      { id: 'armadura', nome: 'Bônus de item da armadura', tipo: 'numero', padrao: 0 }, { id: 'prof_armadura', nome: 'Proficiência em armadura (2/4/6/8 + nível; 0 se destreinado)', tipo: 'numero', padrao: 3 },
    ],
    atributos: ATR6(-5, 7, 0),
    derivados: [{ id: 'ca', nome: 'CA', formula: '10 + DES + armadura + prof_armadura', dica: 'Limite de Destreza da armadura não aplicado' }],
    pericias: {
      modo: 'treino', total: 'MOD + TREINO',
      treinos: [
        { id: 'destreinado', nome: 'Destreinado', formula: '0' }, { id: 'treinado', nome: 'Treinado', formula: 'nivel + 2' },
        { id: 'especialista', nome: 'Especialista', formula: 'nivel + 4' }, { id: 'mestre', nome: 'Mestre', formula: 'nivel + 6' },
        { id: 'lendario', nome: 'Lendário', formula: 'nivel + 8' },
      ],
      lista: p([
        ['Fortitude', 'CON', 'Salvamentos e Percepção'], ['Reflexos', 'DES', 'Salvamentos e Percepção'], ['Vontade', 'SAB', 'Salvamentos e Percepção'], ['Percepção', 'SAB', 'Salvamentos e Percepção'],
        ['Acrobatismo', 'DES', 'Perícias'], ['Arcanismo', 'INT', 'Perícias'], ['Atletismo', 'FOR', 'Perícias'], ['Diplomacia', 'CAR', 'Perícias'], ['Dissimulação', 'CAR', 'Perícias'], ['Furtividade', 'DES', 'Perícias'],
        ['Intimidação', 'CAR', 'Perícias'], ['Ladroagem', 'DES', 'Perícias'], ['Manufatura', 'INT', 'Perícias'], ['Medicina', 'SAB', 'Perícias'], ['Natureza', 'SAB', 'Perícias'], ['Ocultismo', 'INT', 'Perícias'],
        ['Performance', 'CAR', 'Perícias'], ['Religião', 'SAB', 'Perícias'], ['Sobrevivência', 'SAB', 'Perícias'], ['Sociedade', 'INT', 'Perícias'], ['Saber (tema)', 'INT', 'Perícias'],
      ]),
    },
    recursos: [{ id: 'pv', nome: 'Pontos de Vida' }, { id: 'heroismo', nome: 'Pontos de Heroísmo', maxFixo: 3 }],
    listas: [{ id: 'ataques', nome: 'Ataques' }, { id: 'talentos', nome: 'Talentos e habilidades' }, { id: 'magias', nome: 'Magias' }, ...LISTAS_PADRAO.slice(1)],
  },
  {
    id: 'fate-core',
    nome: 'Fate Core',
    resumo: 'Narrativo e flexível: aspectos, perícias na escada de adjetivos, estresse e consequências. Serve para qualquer gênero.',
    tipo: 'aberto', licenca: 'CC-BY-3.0',
    creditos: 'Este trabalho é baseado em Fate Core System e Fate Accelerated Edition (encontrados em https://www.faterpg.com/), produtos da Evil Hat Productions, LLC, desenvolvidos, escritos e editados por Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks e Rob Donoghue, e licenciados para nosso uso sob a licença Creative Commons Attribution 3.0 Unported (https://creativecommons.org/licenses/by/3.0/).',
    dados: '4dF (dados Fate)',
    campos: [
      { id: 'conceito', nome: 'Conceito', tipo: 'texto' }, { id: 'dificuldade', nome: 'Dificuldade', tipo: 'texto' },
      { id: 'aspectos', nome: 'Outros aspectos', tipo: 'area' }, { id: 'recarga', nome: 'Recarga', tipo: 'numero', padrao: 3 },
    ],
    atributos: [], derivados: [],
    pericias: {
      titulo: 'Perícias (escada)', modo: 'treino', total: 'TREINO',
      treinos: [
        { id: 'mediocre', nome: 'Medíocre (+0)', formula: '0' }, { id: 'regular', nome: 'Regular (+1)', formula: '1' },
        { id: 'razoavel', nome: 'Razoável (+2)', formula: '2' }, { id: 'bom', nome: 'Bom (+3)', formula: '3' }, { id: 'otimo', nome: 'Ótimo (+4)', formula: '4' },
      ],
      lista: p([['Atirar', ''], ['Atletismo', ''], ['Comunicação', ''], ['Condução', ''], ['Conhecimentos', ''], ['Contatos', ''], ['Empatia', ''], ['Enganar', ''], ['Furtividade', ''],
        ['Investigar', ''], ['Lutar', ''], ['Ofícios', ''], ['Percepção', ''], ['Provocar', ''], ['Recursos', ''], ['Roubo', ''], ['Vigor', ''], ['Vontade', '']]),
    },
    recursos: [
      { id: 'pontos_destino', nome: 'Pontos de destino', formula: 'recarga' },
      { id: 'estresse_fisico', nome: 'Estresse físico', formula: '2 + min(1, per_vigor) + min(1, max(0, per_vigor - 2))' },
      { id: 'estresse_mental', nome: 'Estresse mental', formula: '2 + min(1, per_vontade) + min(1, max(0, per_vontade - 2))' },
    ],
    listas: [{ id: 'facanhas', nome: 'Façanhas' }, { id: 'consequencias', nome: 'Consequências (suave 2 / moderada 4 / severa 6)' }, { id: 'anotacoes', nome: 'Anotações' }],
  },
  {
    id: 'blades',
    nome: 'Blades in the Dark',
    resumo: 'Golpes e intrigas numa cidade sombria. Ações com pontos (parada de d6), estresse, trauma e dano.',
    tipo: 'aberto', licenca: 'CC-BY-3.0',
    creditos: 'Este trabalho é baseado em Blades in the Dark (encontrado em http://www.bladesinthedark.com/), produto da One Seven Design, desenvolvido e escrito por John Harper, e licenciado para nosso uso sob a licença Creative Commons Attribution 3.0 Unported (http://creativecommons.org/licenses/by/3.0/).',
    dados: 'Parada de d6',
    campos: [
      { id: 'cartilha', nome: 'Cartilha (playbook)', tipo: 'texto' }, { id: 'heranca', nome: 'Herança', tipo: 'texto' },
      { id: 'antecedente', nome: 'Antecedente', tipo: 'texto' }, { id: 'vicio', nome: 'Vício', tipo: 'texto' }, { id: 'aparencia', nome: 'Aparência', tipo: 'texto' },
    ],
    atributos: [], derivados: [
      { id: 'perspicacia', nome: 'Perspicácia (dados de resistência)', formula: 'min(1, per_cacar) + min(1, per_estudar) + min(1, per_vigiar) + min(1, per_ajustar)' },
      { id: 'proeza', nome: 'Proeza (dados de resistência)', formula: 'min(1, per_finesse) + min(1, per_rondar) + min(1, per_escaramucar) + min(1, per_destruir)' },
      { id: 'determinacao', nome: 'Determinação (dados de resistência)', formula: 'min(1, per_sintonizar) + min(1, per_comandar) + min(1, per_conviver) + min(1, per_influenciar)' },
    ],
    pericias: {
      titulo: 'Ações (dados)', modo: 'treino', total: 'TREINO',
      treinos: [0, 1, 2, 3, 4].map(n => ({ id: 'd' + n, nome: '●'.repeat(n) + '○'.repeat(4 - n), formula: String(n) })),
      lista: p([['Caçar', '', 'Perspicácia'], ['Estudar', '', 'Perspicácia'], ['Vigiar', '', 'Perspicácia'], ['Ajustar', '', 'Perspicácia'],
        ['Finesse', '', 'Proeza'], ['Rondar', '', 'Proeza'], ['Escaramuçar', '', 'Proeza'], ['Destruir', '', 'Proeza'],
        ['Sintonizar', '', 'Determinação'], ['Comandar', '', 'Determinação'], ['Conviver', '', 'Determinação'], ['Influenciar', '', 'Determinação']]),
    },
    recursos: [{ id: 'estresse', nome: 'Estresse', maxFixo: 9 }, { id: 'trauma', nome: 'Trauma', maxFixo: 4 }, { id: 'xp', nome: 'XP da cartilha', maxFixo: 8 }],
    listas: [{ id: 'dano', nome: 'Dano (nível 1 / 2 / 3)' }, { id: 'habilidades', nome: 'Habilidades especiais' }, { id: 'equipamento', nome: 'Equipamento e carga' }, { id: 'anotacoes', nome: 'Amigos, rivais e anotações' }],
  },
  {
    id: 'brp',
    nome: 'Basic Roleplaying (BRP — horror, aventura, investigação)',
    resumo: 'Sistema percentual clássico (a base de jogos de investigação e horror). Características, PV, pontos de poder e perícias em %.',
    tipo: 'aberto', licenca: 'ORC License',
    creditos: 'Baseado em Basic Roleplaying: Universal Game Engine, Chaosium Inc., mecânicas disponibilizadas sob a ORC License. Basic Roleplaying e Chaosium são marcas da Chaosium Inc.; este site não é afiliado à Chaosium.',
    dados: 'd100 (porcentagem)',
    campos: [{ id: 'ocupacao', nome: 'Ocupação', tipo: 'texto' }, { id: 'idade', nome: 'Idade', tipo: 'numero' }],
    atributos: [['FOR', 'Força'], ['CON', 'Constituição'], ['TAM', 'Tamanho'], ['INT', 'Inteligência'], ['POD', 'Poder'], ['DES', 'Destreza'], ['APA', 'Aparência'], ['EDU', 'Educação']]
      .map(([id, nome]) => ({ id, nome, min: 1, max: 30, padrao: 10 })),
    derivados: [
      { id: 'pv_max', nome: 'PV máximos', formula: 'teto((CON + TAM) / 2)' },
      { id: 'pp_max', nome: 'Pontos de Poder', formula: 'POD' },
      { id: 'sanidade_inicial', nome: 'Sanidade inicial (opcional)', formula: 'POD * 5' },
      { id: 'esforco', nome: 'Esforço (FOR × 5)', formula: 'FOR * 5' }, { id: 'vigor', nome: 'Vigor (CON × 5)', formula: 'CON * 5' },
      { id: 'ideia', nome: 'Ideia (INT × 5)', formula: 'INT * 5' }, { id: 'sorte', nome: 'Sorte (POD × 5)', formula: 'POD * 5' }, { id: 'agilidade', nome: 'Agilidade (DES × 5)', formula: 'DES * 5' },
    ],
    pericias: {
      titulo: 'Perícias (%)', modo: 'valor', total: 'VALOR',
      lista: p([['Arremessar', ''], ['Atirar', ''], ['Escalar', ''], ['Escutar', ''], ['Esquivar', ''], ['Furtividade', ''], ['Lutar', ''], ['Medicina', ''], ['Navegar', ''],
        ['Ocultar', ''], ['Percepção', ''], ['Persuadir', ''], ['Pesquisar', ''], ['Primeiros Socorros', ''], ['Saltar', ''], ['Ciência', ''], ['Ofício', ''], ['Idioma', '']]),
    },
    recursos: [{ id: 'pv', nome: 'PV', formula: 'pv_max' }, { id: 'pp', nome: 'Pontos de Poder', formula: 'pp_max' }, { id: 'sanidade', nome: 'Sanidade', maxFixo: 99 }],
    listas: [{ id: 'armas', nome: 'Armas' }, ...LISTAS_PADRAO],
  },
  {
    id: 'ordem-paranormal',
    nome: 'Ordem Paranormal (estrutura)',
    resumo: 'Ficha estrutural para jogar com o seu livro: atributos, NEX, PV/PE/Sanidade e lista de perícias. As regras ficam com o livro oficial.',
    tipo: 'estrutura', licenca: 'Sistema comercial — apenas estrutura de ficha',
    creditos: 'Ordem Paranormal RPG é propriedade de seus autores e editora. Este site não reproduz textos do livro e não é afiliado aos autores. Use com o seu livro.',
    dados: 'Parada de d20 (pelo atributo)',
    campos: [
      { id: 'origem', nome: 'Origem', tipo: 'texto' }, { id: 'classe', nome: 'Classe', tipo: 'texto' }, { id: 'trilha', nome: 'Trilha', tipo: 'texto' },
      { id: 'nex', nome: 'NEX (%)', tipo: 'numero', padrao: 5 }, { id: 'defesa', nome: 'Defesa', tipo: 'numero', padrao: 10 }, { id: 'deslocamento', nome: 'Deslocamento (m)', tipo: 'numero', padrao: 9 },
    ],
    atributos: [['AGI', 'Agilidade'], ['FOR', 'Força'], ['INT', 'Intelecto'], ['PRE', 'Presença'], ['VIG', 'Vigor']].map(([id, nome]) => ({ id, nome, min: 0, max: 5, padrao: 1 })),
    derivados: [],
    pericias: {
      modo: 'treino', total: 'TREINO',
      treinos: [{ id: 'destreinado', nome: 'Destreinado', formula: '0' }, { id: 'treinado', nome: 'Treinado (+5)', formula: '5' }, { id: 'veterano', nome: 'Veterano (+10)', formula: '10' }, { id: 'expert', nome: 'Expert (+15)', formula: '15' }],
      lista: p([['Acrobacia', 'AGI'], ['Adestramento', 'PRE'], ['Artes', 'PRE'], ['Atletismo', 'FOR'], ['Atualidades', 'INT'], ['Ciências', 'INT'], ['Crime', 'AGI'], ['Diplomacia', 'PRE'], ['Enganação', 'PRE'], ['Fortitude', 'VIG'],
        ['Furtividade', 'AGI'], ['Iniciativa', 'AGI'], ['Intimidação', 'PRE'], ['Intuição', 'PRE'], ['Investigação', 'INT'], ['Luta', 'FOR'], ['Medicina', 'INT'], ['Ocultismo', 'INT'], ['Percepção', 'PRE'], ['Pilotagem', 'AGI'],
        ['Pontaria', 'AGI'], ['Profissão', 'INT'], ['Reflexos', 'AGI'], ['Religião', 'PRE'], ['Sobrevivência', 'INT'], ['Tática', 'INT'], ['Tecnologia', 'INT'], ['Vontade', 'PRE']]),
    },
    recursos: [{ id: 'pv', nome: 'PV' }, { id: 'pe', nome: 'PE' }, { id: 'san', nome: 'Sanidade' }],
    listas: [{ id: 'habilidades', nome: 'Habilidades e poderes' }, { id: 'rituais', nome: 'Rituais' }, { id: 'inventario', nome: 'Inventário' }, { id: 'anotacoes', nome: 'Anotações' }],
  },
  {
    id: 'tormenta20',
    nome: 'Tormenta20 (estrutura)',
    resumo: 'Ficha estrutural para o maior RPG brasileiro de fantasia: atributos, perícias com metade do nível e treino, PV/PM. Regras no seu livro.',
    tipo: 'estrutura', licenca: 'Sistema comercial — apenas estrutura de ficha',
    creditos: 'Tormenta20 é propriedade da Jambô Editora e seus autores. Este site não reproduz textos do livro e não é afiliado à Jambô.',
    dados: 'd20',
    campos: [
      { id: 'raca', nome: 'Raça', tipo: 'texto' }, { id: 'classe', nome: 'Classe', tipo: 'texto' }, { id: 'origem', nome: 'Origem', tipo: 'texto' },
      { id: 'divindade', nome: 'Divindade', tipo: 'texto' }, { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 },
      { id: 'defesa_bonus', nome: 'Bônus de armadura/escudo', tipo: 'numero', padrao: 0 },
    ],
    atributos: ATR6(-5, 10, 0),
    derivados: [{ id: 'defesa', nome: 'Defesa', formula: '10 + DES + defesa_bonus' }],
    pericias: {
      modo: 'treino', total: 'MOD + TREINO',
      treinos: [
        { id: 'destreinado', nome: 'Destreinado', formula: 'piso(nivel / 2)' },
        { id: 'treinado', nome: 'Treinado', formula: 'piso(nivel / 2) + 2 + 2 * min(1, max(0, nivel - 6)) + 2 * min(1, max(0, nivel - 14))' },
      ],
      lista: p([['Acrobacia', 'DES'], ['Adestramento', 'CAR'], ['Atletismo', 'FOR'], ['Atuação', 'CAR'], ['Cavalgar', 'DES'], ['Conhecimento', 'INT'], ['Cura', 'SAB'], ['Diplomacia', 'CAR'], ['Enganação', 'CAR'], ['Fortitude', 'CON'],
        ['Furtividade', 'DES'], ['Guerra', 'INT'], ['Iniciativa', 'DES'], ['Intimidação', 'CAR'], ['Intuição', 'SAB'], ['Investigação', 'INT'], ['Jogatina', 'CAR'], ['Ladinagem', 'DES'], ['Luta', 'FOR'], ['Misticismo', 'INT'],
        ['Nobreza', 'INT'], ['Ofício', 'INT'], ['Percepção', 'SAB'], ['Pilotagem', 'DES'], ['Pontaria', 'DES'], ['Reflexos', 'DES'], ['Religião', 'SAB'], ['Sobrevivência', 'SAB'], ['Vontade', 'SAB']]),
    },
    recursos: [{ id: 'pv', nome: 'PV' }, { id: 'pm', nome: 'PM' }],
    listas: [{ id: 'ataques', nome: 'Ataques' }, { id: 'poderes', nome: 'Poderes e habilidades' }, { id: 'magias', nome: 'Magias' }, { id: 'inventario', nome: 'Inventário' }, { id: 'anotacoes', nome: 'Anotações' }],
  },
  {
    id: 'livre',
    nome: 'Ficha livre',
    resumo: 'Para qualquer sistema que ainda não está aqui (ex.: Assimilação): campos livres, recursos e listas.',
    tipo: 'estrutura', licenca: 'Genérica', dados: 'Qualquer',
    campos: [{ id: 'sistema_nome', nome: 'Sistema', tipo: 'texto' }, { id: 'conceito', nome: 'Conceito', tipo: 'texto' }, { id: 'atributos_texto', nome: 'Atributos', tipo: 'area' }, { id: 'pericias_texto', nome: 'Perícias', tipo: 'area' }],
    atributos: [], derivados: [],
    recursos: [{ id: 'vida', nome: 'Vida' }, { id: 'energia', nome: 'Energia/Mana' }, { id: 'mente', nome: 'Mente/Sanidade' }],
    listas: LISTAS_PADRAO,
  },
]

export const sistemaPorId = (id: string) => SISTEMAS.find(s => s.id === id)
/** O sistema Lunethernnyis original continua usando a Ficha V8. */
export const SISTEMA_V8 = 'lunethernnyis-v8'
export const sistemaValido = (id: unknown): id is string => typeof id === 'string' && (id === SISTEMA_V8 || SISTEMAS.some(s => s.id === id))
