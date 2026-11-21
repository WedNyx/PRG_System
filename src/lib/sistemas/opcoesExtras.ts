/**
 * Sugestões para campos que antes eram texto livre (v0.36.6): origens, trilhas, divindades, ocupações e antecedentes.
 * O campo continua aceitando qualquer texto (sugestão, não trava). Nada é aplicado na ficha sozinho.
 * Sistemas comerciais (Ordem, Tormenta20, Call of Cthulhu): só os nomes — o que cada um dá está no livro.
 * Pathfinder 2e (ORC) e BRP (ORC): com uma descrição curta escrita por nós.
 */
import type { OpcaoCampo } from './tipos'

const nomes = (l: string[]): OpcaoCampo[] => l.map(nome => ({ nome }))
const com = (l: [string, string][]): OpcaoCampo[] => l.map(([nome, descricao]) => ({ nome, descricao }))

export const OPCOES_EXTRAS: Record<string, Record<string, OpcaoCampo[]>> = {
  'ordem-paranormal': {
    origem: nomes(['Acadêmico', 'Agente de Saúde', 'Amnésico', 'Artista', 'Atleta', 'Chef', 'Criminoso', 'Cultista Arrependido', 'Desgarrado', 'Engenheiro', 'Executivo', 'Investigador', 'Lutador', 'Magnata', 'Mercenário', 'Militar', 'Operário', 'Policial', 'Religioso', 'Servidor Público', 'Teórico da Conspiração', 'T.I.', 'Trabalhador Rural', 'Trambiqueiro', 'Universitário', 'Vítima']),
    trilha: com([['Aniquilador', 'Trilha de Combatente'], ['Comandante de Campo', 'Trilha de Combatente'], ['Guerreiro', 'Trilha de Combatente'], ['Operações Especiais', 'Trilha de Combatente'], ['Tropa de Choque', 'Trilha de Combatente'],
      ['Atirador de Elite', 'Trilha de Especialista'], ['Infiltrador', 'Trilha de Especialista'], ['Médico de Campo', 'Trilha de Especialista'], ['Negociador', 'Trilha de Especialista'], ['Técnico', 'Trilha de Especialista'],
      ['Conduíte', 'Trilha de Ocultista'], ['Flagelador', 'Trilha de Ocultista'], ['Graduado', 'Trilha de Ocultista'], ['Intuitivo', 'Trilha de Ocultista'], ['Lâmina Paranormal', 'Trilha de Ocultista']]),
  },
  tormenta20: {
    origem: nomes(['Acólito', 'Amigo dos Animais', 'Amnésico', 'Aristocrata', 'Artesão', 'Artista', 'Assistente de Laboratório', 'Batedor', 'Capanga', 'Charlatão', 'Circense', 'Criminoso', 'Curandeiro', 'Eremita', 'Escravo', 'Estudioso', 'Fazendeiro', 'Forasteiro', 'Gladiador', 'Guarda', 'Herdeiro', 'Herói Camponês', 'Marujo', 'Mateiro', 'Membro de Guilda', 'Mercador', 'Minerador', 'Nômade', 'Pivete', 'Refugiado', 'Seguidor', 'Selvagem', 'Soldado', 'Taverneiro', 'Trabalhador']),
    divindade: nomes(['Aharadak', 'Allihanna', 'Arsenal', 'Azgher', 'Hyninn', 'Kallyadranoch', 'Khalmyr', 'Lena', 'Lin-Wu', 'Marah', 'Megalokk', 'Nimb', 'Oceano', 'Sszzaas', 'Tanna-Toh', 'Tenebra', 'Thwor', 'Thyatis', 'Valkaria', 'Wynna']),
  },
  'call-of-cthulhu': {
    ocupacao: nomes(['Advogado', 'Andarilho', 'Antiquário', 'Arqueólogo', 'Artista', 'Ator', 'Atleta', 'Autor', 'Bibliotecário', 'Clérigo', 'Contador', 'Criminoso', 'Detetive particular', 'Diletante', 'Enfermeiro', 'Engenheiro', 'Fazendeiro', 'Fotógrafo', 'Jornalista', 'Médico', 'Militar', 'Missionário', 'Motorista', 'Músico', 'Parapsicólogo', 'Piloto', 'Policial (detetive)', 'Policial (patrulha)', 'Professor universitário', 'Psicólogo', 'Psiquiatra']),
  },
  brp: {
    ocupacao: com([['Artista', 'Vive do que cria: pintura, música, escrita.'], ['Artesão', 'Faz coisas com as mãos: ferreiro, marceneiro, costureiro.'], ['Atleta', 'Corpo treinado para competir.'],
      ['Animador', 'Entretém o público: palco, circo, rádio.'], ['Cientista', 'Pesquisa e laboratório.'], ['Clérigo', 'Serve a uma fé ou templo.'], ['Criminoso', 'Vive fora da lei.'],
      ['Detetive', 'Investiga crimes e mistérios.'], ['Diletante', 'Rico, curioso e com tempo livre.'], ['Médico', 'Cuida de feridos e doentes.'], ['Engenheiro', 'Projeta e conserta máquinas e construções.'],
      ['Explorador', 'Viaja por lugares pouco conhecidos.'], ['Fazendeiro', 'Trabalha a terra e os animais.'], ['Guerreiro', 'Luta por ofício: mercenário, guarda, cavaleiro.'], ['Jornalista', 'Apura e conta notícias.'],
      ['Mecânico', 'Mantém veículos e máquinas funcionando.'], ['Mercador', 'Compra, vende e negocia.'], ['Nobre', 'Nasceu com título e influência.'], ['Piloto', 'Conduz aviões, naves ou veículos.'],
      ['Policial', 'Mantém a ordem e prende criminosos.'], ['Soldado', 'Serviu num exército.']]),
  },
  pf2e: {
    antecedente: com([['Acólito', 'Criado num templo; conhece a fé e os rituais.'], ['Acrobata', 'Artista de circo ou de rua, ágil e ousado.'], ['Amigo dos animais', 'Cresceu cuidando de bichos.'],
      ['Artesão', 'Aprendiz de um ofício manual.'], ['Artista', 'Pintor, escultor ou poeta.'], ['Bandido', 'Assaltava viajantes nas estradas.'], ['Taverneiro', 'Trabalhou atrás do balcão e ouviu de tudo.'],
      ['Advogado', 'Defendia causas diante de juízes.'], ['Caçador de recompensas', 'Rastreava foragidos por dinheiro.'], ['Charlatão', 'Vivia de golpes e conversa.'], ['Criminoso', 'Sabe se virar no submundo.'],
      ['Detetive', 'Resolvia casos e seguia pistas.'], ['Emissário', 'Levava mensagens entre povos.'], ['Animador', 'Ganhava a vida no palco.'], ['Lavrador', 'Cresceu no campo, de sol a sol.'],
      ['Médico de campo', 'Cuidava de feridos em batalha.'], ['Vidente', 'Lia o futuro (ou fingia).'], ['Apostador', 'Vivia de sorte e blefe.'], ['Gladiador', 'Lutava em arenas para o público.'],
      ['Guarda', 'Protegia muros, portões ou pessoas.'], ['Herborista', 'Conhece plantas que curam.'], ['Eremita', 'Viveu isolado, longe de todos.'], ['Caçador', 'Vivia do que caçava.'],
      ['Trabalhador braçal', 'Força e resistência no trabalho pesado.'], ['Discípulo marcial', 'Treinou numa escola de luta.'], ['Mercador', 'Comprava e vendia pelo caminho.'], ['Minerador', 'Trabalhou nas profundezas.'],
      ['Nobre', 'Nasceu entre a elite.'], ['Nômade', 'Nunca ficou muito tempo num lugar.'], ['Prisioneiro', 'Passou tempo atrás das grades.'], ['Marinheiro', 'Viveu no mar.'],
      ['Estudioso', 'Passou a vida entre livros.'], ['Batedor', 'Explorava à frente do grupo.'], ['Menino de rua', 'Cresceu nas ruas da cidade.'], ['Professor', 'Ensinava outras pessoas.'],
      ['Funileiro', 'Inventava e consertava engenhocas.'], ['Guerreiro', 'Treinado para a luta desde cedo.']]),
  },
}
