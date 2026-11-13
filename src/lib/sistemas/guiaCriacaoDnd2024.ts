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
import { conjuradoresDnd } from './dnd2024Conjuracao'

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
  const marcos = progressaoVisivel(MARCOS_DND_2024, progressoDaFichaDnd(d))
  const pendentes = marcos.filter(m => m.estado === 'escolher' || m.estado === 'pendente')
  const precisaMagias = conjuradoresDnd(d).some(l => l.truques > 0 || l.preparadas > 0)
  const magiaAnotada = !!d.dndMagias && Object.keys(d.dndMagias).length > 0
  const equipAnotado = Array.isArray(d.itens) && d.itens.length > 0
  return [
    { id: 'identidade', titulo: '1. Conceito e identidade', estado: d.nome?.trim() ? 'registrado' : 'pendente', aba: 'principal',
      descricao: 'Converse sobre a ideia do personagem, seu papel no grupo e registre o nome. História e personalidade continuam escolhas narrativas.' },
    { id: 'classe', titulo: '2. Classe inicial', estado: classe ? 'registrado' : 'pendente', aba: 'principal',
      descricao: classe ? `Classe registrada: ${classe.nome}. Confira Dado de Vida, equipamentos, salvaguardas e perícias da classe no SRD.`
        : 'Escolha uma das classes disponíveis. A classe determina proficiências, recursos e progressão.' },
    { id: 'especie', titulo: '3. Espécie e linhagem', estado: campo('especie') ? 'registrado' : 'pendente', aba: 'principal',
      descricao: 'Escolha a espécie. Depois confirme as linhagens, ancestralidades ou legados exigidos na aba Árvore e as fontes autorizadas.' },
    { id: 'antecedente', titulo: '4. Antecedente', estado: campo('antecedente') ? 'registrado' : 'pendente', aba: 'principal',
      descricao: 'O antecedente define aumentos de atributos entre opções permitidas, proficiências, ferramenta e talento de origem. Confira cada benefício.' },
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
    { id: 'magias', titulo: '9. Magias e recursos de conjuração', estado: !precisaMagias ? 'nao-aplica' : magiaAnotada ? 'registrado' : 'pendente', aba: 'habilidades',
      descricao: 'Quando aplicável, selecione truques e magias conforme a classe, nível e fontes autorizadas. Confira espaços, preparação e atributo de conjuração.' },
    { id: 'revisao', titulo: '10. Revisão final do mestre', estado: 'revisar', aba: 'principal',
      descricao: 'Revise PV, CA, perícias, salvaguardas, usos, progressão, fontes e exceções. O guia não aprova a ficha automaticamente.' },
  ]
}
