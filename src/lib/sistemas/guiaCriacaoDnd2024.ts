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
import { ANTECEDENTES_GUIADOS, lerRegistroAntecedenteDnd } from './dnd2024Antecedentes'

export type EstadoEtapa = 'registrado' | 'pendente' | 'revisar' | 'nao-aplica'
export type EtapaGuia = {
  id: string; titulo: string; estado: EstadoEtapa
  descricao: string; aba: 'principal' | 'atributos' | 'arvore' | 'habilidades' | 'equipamentos'
}
type DadosGuia = Pick<DadosFicha, 'nome' | 'campos' | 'atributos' | 'dndEscolhas' | 'dndMulticlasse' | 'dndMagias' | 'itens'>

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
  const especieMagica = ['elfo', 'gnomo', 'tiferino'].includes(especieId)
  const precisaMagiasDaClasse = conjuradoresDnd(d).some(l => l.truques > 0 || l.preparadas > 0)
  const precisaMagias = precisaMagiasDaClasse || especieMagica
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
        ? 'Escolha o antecedente. Ele determina os atributos permitidos, talento de origem, perícias, ferramenta e equipamento.'
        : guiadoAntecedente
          ? aumentoConfirmado
            ? 'Distribuição registrada na ficha. Confira as proficiências, o talento, a ferramenta e os itens com o mestre; registrado não significa aprovado.'
            : antecedenteId === 'forasteiro'
              ? 'Forasteiro é LEGADO 2014: o mestre deve liberar o PHB 2014. Vá a Atributos para distribuir +2/+1 ou +1/+1/+1, escolher talento de origem, instrumento e idioma.'
              : 'A distribuição do antecedente ainda não foi aplicada. Vá a Atributos e selecione +2/+1 ou +1/+1/+1 somente entre os três atributos autorizados.'
          : 'Antecedente do Livro do Jogador 2024: a plataforma tem apenas os metadados. Mestre e jogador devem conferir os três atributos elegíveis, o talento, as proficiências e o equipamento no livro.' },
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
      estado: !precisaMagias ? 'nao-aplica' : precisaMagiasDaClasse ? (magiaAnotada ? 'registrado' : 'pendente') : 'revisar',
      aba: 'habilidades',
      descricao: especieMagica
        ? 'Além das magias da classe, confira as magias concedidas pela espécie e o atributo de conjuração escolhido para a linhagem ou legado. A escolha na árvore ainda não adiciona automaticamente essas magias.'
        : 'Selecione truques e magias conforme a classe, nível e fontes autorizadas. Confira espaços, preparação e atributo de conjuração.' },
    { id: 'revisao', titulo: '10. Revisão final do mestre', estado: 'revisar', aba: 'principal',
      descricao: 'Revise PV, CA, perícias, salvaguardas, usos, progressão, fontes e exceções. O guia não aprova a ficha automaticamente.' },
  ]
}
