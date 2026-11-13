/**
 * Guia interativo: etapas da criação segundo a ordem do D&D 2024 (SRD 5.2.1).
 * Uma etapa "registrada" confirma apenas que o campo tem dados, NÃO que todas
 * as escolhas e cálculos foram auditados pelo mestre.
 * Referência aberta: https://www.dndbeyond.com/srd (CC BY 4.0).
 */
import type { DadosFicha } from './tipos'
import { CLASSES_SRD } from './dnd2024Srd'
import { idDe } from './dnd2024Classes'
import { progressoDaFichaDnd } from './dnd2024Ficha'
import { progressaoVisivel } from './dnd2024Progressao'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { MARCOS_ORIGENS_SRD } from './dnd2024Origens'
import { lerEscolhasDnd } from './dnd2024Ficha'
import { conjuradoresDnd } from './dnd2024Conjuracao'
import { ANTECEDENTES_GUIADOS, lerRegistroAntecedenteDnd, magiasDeAntecedenteDnd, validarDetalhesAntecedenteDnd, validarDistribuicaoAntecedenteDnd } from './dnd2024Antecedentes'

export type EstadoEtapa = 'registrado' | 'pendente' | 'revisar' | 'nao-aplica'
export type EtapaGuia = {
  id: string; titulo: string; estado: EstadoEtapa
  descricao: string; aba: 'principal' | 'atributos' | 'arvore' | 'habilidades' | 'equipamentos'
}
type DadosGuia = Pick<DadosFicha, 'nome' | 'campos' | 'atributos' | 'dndEscolhas' | 'dndMulticlasse' | 'dndMagias' | 'dndAntecedente' | 'itens'>

export function etapasCriacaoDnd2024(d: DadosGuia): EtapaGuia[] {
  const campo = (id: string) => String(d.campos?.[id] ?? '').trim()
  const classe = CLASSES_SRD.find(c => c.id === idDe(campo('classe')))
  const preenchidos = ['FOR','DES','CON','INT','SAB','CAR'].map(id => Number(d.atributos?.[id]))
  const atributosAnotados = preenchidos.every(n => Number.isFinite(n) && n >= 3) && preenchidos.some(n => n !== 10)
  const progresso = progressoDaFichaDnd(d)
  const marcos = progressaoVisivel(MARCOS_DND_2024, progresso)
  const pendentes = marcos.filter(m => m.estado === 'escolher' || m.estado === 'pendente')
  const escolhas = lerEscolhasDnd(d.dndEscolhas)
  const especieId = progresso.especieId ?? ''
  const antecedenteId = progresso.antecedenteId ?? ''
  // Opções do nível 1 são obrigatórias assim que a espécie é escolhida,
  // mesmo antes de a classe ter sido definida. Não presumir aprovação só pelo nome.
  const escolhasDaEspecie = MARCOS_ORIGENS_SRD.filter(m =>
    m.origem === 'especie' && m.origemId === especieId && m.modo === 'escolha' && m.nivel === 1)
  const faltasEspecie = escolhasDaEspecie.filter(m =>
    !m.opcoes?.some(o => o.id === escolhas[m.id]))
  const especieAberta = MARCOS_ORIGENS_SRD.some(m => m.origem === 'especie' && m.origemId === especieId)
  const registroAntecedente = lerRegistroAntecedenteDnd(d.dndAntecedente)
  const guiadoAntecedente = ANTECEDENTES_GUIADOS[antecedenteId]
  const aumentoConfirmado = !!guiadoAntecedente && registroAntecedente?.id === antecedenteId
    && validarDistribuicaoAntecedenteDnd(antecedenteId, registroAntecedente.aumentos).length === 0
    && validarDetalhesAntecedenteDnd(registroAntecedente).length === 0
  const especieMagica = ['elfo', 'gnomo', 'tiferino'].includes(especieId)
  const precisaMagiasDaClasse = conjuradoresDnd(d).some(l => l.truques > 0 || l.preparadas > 0)
  const origemMagica = magiasDeAntecedenteDnd(d)
  const temTalentoMagico = !!(guiadoAntecedente?.talentoId?.startsWith('iniciado-magia') ||
    (antecedenteId === 'forasteiro' && registroAntecedente?.talento?.startsWith('iniciado-magia')))
  const talentoHumanoMagico = especieId === 'humano' && escolhas['esp-humano-versatil'] === 'iniciado-magia'
  const precisaMagias = precisaMagiasDaClasse || especieMagica || temTalentoMagico || talentoHumanoMagico
  const magiaAnotada = !!d.dndMagias && Object.keys(d.dndMagias).length > 0
  const equipAnotado = Array.isArray(d.itens) && d.itens.length > 0
  return [
    { id: 'identidade', titulo: '1. Conceito e identidade', estado: d.nome?.trim() ? 'registrado' : 'pendente', aba: 'principal',
      descricao: 'Converse sobre a ideia do personagem, seu papel no grupo e registre o nome. História e personalidade continuam escolhas narrativas.' },
    { id: 'classe', titulo: '2. Classe inicial', estado: classe ? 'registrado' : 'pendente', aba: 'principal',
      descricao: classe ? `Classe registrada: ${classe.nome}. Confira Dado de Vida, equipamentos, salvaguardas e perícias da classe no SRD.`
        : 'Escolha uma das classes disponíveis. A classe determina proficiências, recursos e progressão.' },
    { id: 'especie', titulo: '3. Espécie e linhagem',
      estado: !especieId ? 'pendente' : !especieAberta ? 'revisar' : faltasEspecie.length ? 'pendente' : 'registrado',
      aba: !especieId ? 'principal' : 'arvore',
      descricao: !especieId
        ? 'Escolha a espécie na aba Principal para revelar suas características.'
        : !especieAberta
          ? 'Espécie de outra fonte: confira diretamente o livro autorizado, pois o SRD não fornece todos os traços.'
          : faltasEspecie.length
            ? `Espécie ${campo('especie')}: faltam ${faltasEspecie.length} escolha(s) na Árvore — ${faltasEspecie.map(m => m.nome).join(', ')}. O atributo de magia da linhagem deve ser escolhido junto com ela.`
            : 'As opções de espécie do SRD estão registradas. Confira seus efeitos, traços, magias e o tamanho/deslocamento no livro.' },
    { id: 'antecedente', titulo: '4. Antecedente e aumentos',
      estado: !antecedenteId ? 'pendente' : guiadoAntecedente
        ? (aumentoConfirmado ? 'registrado' : 'pendente') : 'revisar',
      aba: guiadoAntecedente ? 'atributos' : 'principal',
      descricao: !antecedenteId
        ? 'Escolha um antecedente para conferir atributos, proficiências, ferramentas, talento e equipamento.'
        : guiadoAntecedente
          ? aumentoConfirmado
            ? 'Distribuição e escolhas internas registradas. Confira o texto dos talentos, o inventário e os efeitos especiais com o mestre; o registro não é aprovação final.'
            : antecedenteId === 'forasteiro'
              ? 'Forasteiro (legado 2014): habilite o PHB 2014 e registre os aumentos, o talento, instrumento e idioma na aba Atributos.'
              : 'Vá à aba Atributos para escolher +2/+1 ou +1/+1/+1 e registrar equipamento, ferramentas e as opções adicionais do talento de origem. Nenhum bônus será somado sem confirmação.'
          : 'Antecedente não cadastrado: consulte a obra original e revise com o mestre.' },
    { id: 'atributos', titulo: '5. Atributos e aumentos', estado: atributosAnotados ? 'registrado' : 'pendente', aba: 'atributos',
      descricao: 'Use o conjunto padrão, compra de 27 pontos ou rolagem aprovada pelo mestre. Some os aumentos do antecedente UMA vez; esta etapa não prova que a distribuição está correta.' },
    { id: 'proficiencias', titulo: '6. Proficiências e salvaguardas', estado: 'revisar', aba: 'atributos',
      descricao: 'O mestre deve conferir perícias da classe, do antecedente, ferramentas, idiomas e salvaguardas. A ficha calcula os totais, mas não substitui a validação das escolhas.' },
    { id: 'habilidades', titulo: '7. Características e escolhas por nível', estado: !classe ? 'pendente' : pendentes.length ? 'pendente' : 'registrado', aba: 'arvore',
      descricao: !classe ? 'Escolha uma classe para ver sua progressão.' : pendentes.length
        ? `Há ${pendentes.length} escolha(s) pendente(s), incluindo: ${pendentes.slice(0, 3).map(m => m.nome).join(', ')}. O mestre pode acrescentar poderes próprios na árvore Híbrida.`
        : 'As escolhas catalogadas estão registradas até o nível atual. Confira efeitos e requisitos que ainda exigem intervenção manual.' },
    { id: 'equipamentos', titulo: '8. Equipamentos e defesa', estado: equipAnotado ? 'registrado' : 'pendente', aba: 'equipamentos',
      descricao: 'Registre equipamento inicial, armas, armaduras, escudo, ferramentas e moedas. Depois confira CA, deslocamento e limitações de uso.' },
    { id: 'magias', titulo: '9. Magias e recursos de conjuração',
      estado: !precisaMagias ? 'nao-aplica' : (temTalentoMagico && !origemMagica) || talentoHumanoMagico
        ? 'pendente' : precisaMagiasDaClasse ? (magiaAnotada ? 'registrado' : 'pendente') : especieMagica ? 'revisar' : 'registrado',
      aba: 'habilidades',
      descricao: talentoHumanoMagico
        ? 'Iniciado em Magia pelo Humano Versátil: a plataforma ainda não permite registrar as escolhas desse talento da espécie; peça revisão ao mestre. Não atribua magias automaticamente.'
        : temTalentoMagico && !origemMagica
          ? 'O antecedente concede Iniciado em Magia, mas faltam magias ou atributo de conjuração. Complete a criação guiada na aba Atributos.'
          : origemMagica
            ? 'As três magias do antecedente aparecem no Grimório, com atributo e CD próprios, sem ocupar espaços de preparação da classe. A magia de 1º nível tem um uso gratuito recuperado no descanso longo. Revise outras magias da classe ou espécie separadamente.'
            : especieMagica
              ? 'Confira as magias concedidas pela espécie e o atributo de conjuração escolhido na árvore; ainda não são adicionadas automaticamente ao Grimório.'
              : 'Selecione truques e magias conforme a classe, nível e fontes autorizadas. Confira espaços, preparação e atributo de conjuração.' },
    { id: 'revisao', titulo: '10. Revisão final do mestre', estado: 'revisar', aba: 'principal',
      descricao: 'Revise PV, CA, perícias, salvaguardas, usos, progressão, fontes e exceções. O guia não aprova a ficha automaticamente.' },
  ]
}
