/**
 * Metadados factuais dos 12 antecedentes adicionais do PHB 2024.
 * Resumos originais, sem copiar descrições narrativas ou efeitos protegidos.
 * Fonte comercial: Player's Handbook (2024), Wizards of the Coast.
 * Referências públicas de conferência:
 * https://www.dndbeyond.com/posts/1785-the-backgrounds-and-origin-feats-in-the-2024
 * https://pages.roll20.net/dnd/2024-backgrounds
 * O texto integral das características e talentos fica no livro autorizado.
 */
import type { ModeloAntecedenteDnd } from './dnd2024Antecedentes'

export const ANTECEDENTES_PHB_GUIA: Record<string, ModeloAntecedenteDnd> = {
  artesao: {
    id: 'artesao', nome: 'Artesão', elegiveis: ['FOR', 'DES', 'INT'],
    talento: 'Artesão (Crafter)', talentoId: 'crafter',
    pericias: ['investigacao', 'persuasao'], ferramenta: 'Ferramentas de artesão (um tipo à escolha)',
    ferramentaEscolha: 'artesao', fonte: 'phb2024',
    pacote: ['Ferramentas de artesão escolhidas', '2 bolsas', 'Roupas de viajante'],
    moedasPacote: 32,
    nota: 'Escolha um tipo de ferramentas de artesão; o talento Artesão possui benefícios adicionais a consultar no PHB 2024.',
  },
  charlatao: {
    id: 'charlatao', nome: 'Charlatão', elegiveis: ['DES', 'CON', 'CAR'],
    talento: 'Habilidoso (Skilled)', talentoId: 'habilidoso',
    pericias: ['enganacao', 'prestidigitacao'], ferramenta: 'Kit de falsificação',
    fonte: 'phb2024', pacote: ['Kit de falsificação', 'Fantasia', 'Roupas finas'],
    moedasPacote: 15,
    nota: 'Habilidoso concede três proficiências adicionais a escolher em perícias ou ferramentas. Conferir e registrar na ficha.',
  },
  animador: {
    id: 'animador', nome: 'Animador', elegiveis: ['FOR', 'DES', 'CAR'],
    talento: 'Músico (Musician)', talentoId: 'musician',
    pericias: ['acrobacia', 'atuacao'], ferramenta: 'Instrumento musical (um tipo à escolha)',
    ferramentaEscolha: 'instrumento', fonte: 'phb2024',
    pacote: ['Instrumento musical escolhido', '2 fantasias', 'Espelho', 'Perfume', 'Roupas de viajante'],
    moedasPacote: 11,
    nota: 'Além do instrumento do antecedente, Músico concede proficiências próprias e benefícios de inspiração; ver PHB.',
  },
  fazendeiro: {
    id: 'fazendeiro', nome: 'Fazendeiro', elegiveis: ['FOR', 'CON', 'SAB'],
    talento: 'Robusto (Tough)', talentoId: 'tough',
    pericias: ['adestrar_animais', 'natureza'], ferramenta: 'Ferramentas de carpinteiro',
    fonte: 'phb2024',
    pacote: ['Foice', 'Ferramentas de carpinteiro', 'Kit de curandeiro', 'Panela de ferro', 'Pá', 'Roupas de viajante'],
    moedasPacote: 30,
    nota: 'Robusto aumenta os PV máximos em 2 por nível. A ficha aplica esse bônus uma vez quando os efeitos automáticos estiverem ligados.',
  },
  guarda: {
    id: 'guarda', nome: 'Guarda', elegiveis: ['FOR', 'INT', 'SAB'],
    talento: 'Alerta (Alert)', talentoId: 'alerta',
    pericias: ['atletismo', 'percepcao'], ferramenta: 'Kit de jogos (um tipo à escolha)',
    ferramentaEscolha: 'jogo', fonte: 'phb2024',
    pacote: ['Lança', 'Besta leve', '20 virotes', 'Kit de jogos escolhido', 'Lanterna coberta', 'Algemas', 'Aljava', 'Roupas de viajante'],
    moedasPacote: 12,
    nota: 'Alerta adiciona proficiência à Iniciativa, uma única vez. O efeito de trocar iniciativa exige resolução na mesa.',
  },
  guia: {
    id: 'guia', nome: 'Guia', elegiveis: ['DES', 'CON', 'SAB'],
    talento: 'Iniciado em Magia (Druida)', talentoId: 'iniciado-magia-druida',
    pericias: ['furtividade', 'sobrevivencia'], ferramenta: 'Ferramentas de cartógrafo',
    fonte: 'phb2024',
    pacote: ['Arco curto', '20 flechas', 'Ferramentas de cartógrafo', 'Saco de dormir', 'Aljava', 'Tenda', 'Roupas de viajante'],
    moedasPacote: 3,
    nota: 'Iniciado em Magia (Druida) exige escolher truques, magia de 1º círculo e atributo de conjuração; não são concedidos sem essa decisão.',
  },
  eremita: {
    id: 'eremita', nome: 'Eremita', elegiveis: ['CON', 'SAB', 'CAR'],
    talento: 'Curandeiro (Healer)', talentoId: 'healer',
    pericias: ['medicina', 'religiao'], ferramenta: 'Kit de herbalismo',
    fonte: 'phb2024',
    pacote: ['Bordão', 'Kit de herbalismo', 'Saco de dormir', 'Livro de filosofia', 'Lamparina', '3 frascos de óleo', 'Roupas de viajante'],
    moedasPacote: 16,
    nota: 'Os benefícios do talento Curandeiro devem ser conferidos no PHB; não são aplicados automaticamente como cura.',
  },
  mercador: {
    id: 'mercador', nome: 'Mercador', elegiveis: ['CON', 'INT', 'CAR'],
    talento: 'Sortudo (Lucky)', talentoId: 'lucky',
    pericias: ['adestrar_animais', 'persuasao'], ferramenta: 'Ferramentas de navegador',
    fonte: 'phb2024',
    pacote: ['Ferramentas de navegador', '2 bolsas', 'Roupas de viajante'],
    moedasPacote: 22,
    nota: 'Sortudo concede pontos de sorte associados à proficiência. Gastos e recuperação precisam ser anotados em mesa.',
  },
  nobre: {
    id: 'nobre', nome: 'Nobre', elegiveis: ['FOR', 'INT', 'CAR'],
    talento: 'Habilidoso (Skilled)', talentoId: 'habilidoso',
    pericias: ['historia', 'persuasao'], ferramenta: 'Kit de jogos (um tipo à escolha)',
    ferramentaEscolha: 'jogo', fonte: 'phb2024',
    pacote: ['Kit de jogos escolhido', 'Roupas finas', 'Perfume'],
    moedasPacote: 29,
    nota: 'Habilidoso concede três proficiências adicionais a escolher em perícias ou ferramentas; registrar sem duplicar proficiências.',
  },
  marinheiro: {
    id: 'marinheiro', nome: 'Marinheiro', elegiveis: ['FOR', 'DES', 'SAB'],
    talento: 'Brigão de Taverna (Tavern Brawler)', talentoId: 'tavern-brawler',
    pericias: ['acrobacia', 'percepcao'], ferramenta: 'Ferramentas de navegador',
    fonte: 'phb2024',
    pacote: ['Adaga', 'Ferramentas de navegador', 'Corda', 'Roupas de viajante'],
    moedasPacote: 20,
    nota: 'Brigão de Taverna modifica combate desarmado e armas improvisadas; verificar a regra oficial antes da rolagem.',
  },
  escriba: {
    id: 'escriba', nome: 'Escriba', elegiveis: ['DES', 'INT', 'SAB'],
    talento: 'Habilidoso (Skilled)', talentoId: 'habilidoso',
    pericias: ['investigacao', 'percepcao'], ferramenta: 'Suprimentos de caligrafia',
    fonte: 'phb2024',
    pacote: ['Suprimentos de caligrafia', 'Roupas finas', 'Lamparina', '3 frascos de óleo', '12 folhas de pergaminho'],
    moedasPacote: 23,
    nota: 'Habilidoso concede três proficiências adicionais a escolher em perícias ou ferramentas; registrar sem duplicar proficiências.',
  },
  viajante: {
    id: 'viajante', nome: 'Viajante', elegiveis: ['DES', 'SAB', 'CAR'],
    talento: 'Sortudo (Lucky)', talentoId: 'lucky',
    pericias: ['intuicao', 'furtividade'], ferramenta: 'Ferramentas de ladrão',
    fonte: 'phb2024',
    pacote: ['2 adagas', 'Ferramentas de ladrão', 'Kit de jogos à escolha', 'Saco de dormir', '2 bolsas', 'Roupas de viajante'],
    moedasPacote: 16,
    nota: 'Sortudo concede pontos de sorte; o mestre deve acompanhar o gasto e a recuperação entre descansos.',
  },
}
