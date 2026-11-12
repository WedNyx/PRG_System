import type { MarcoDnd } from './dnd2024Progressao'

/**
 * Catálogo INICIAL e propositalmente parcial: Guerreiro (marcos selecionados).
 * Material de referência: D&D SRD 5.2.1, CC BY 4.0.
 * https://www.dndbeyond.com/srd
 * A opção do livro comercial não é reproduzida aqui.
 * Não presumir completude nem aplicar bônus a partir destes itens: são guias visuais.
 */
export const MARCOS_DND_2024: MarcoDnd[] = [
  { id: 'guerreiro-segundo-folego', nome: 'Segundo Fôlego', nivel: 1, origem: 'classe', origemId: 'guerreiro', modo: 'automatico', fonte: 'SRD 5.2.1', descricao: 'Recuperação de PV por meio de uma característica de classe; consulte os usos no SRD.' },
  { id: 'guerreiro-surto-acao', nome: 'Surto de Ação', nivel: 2, origem: 'classe', origemId: 'guerreiro', modo: 'automatico', fonte: 'SRD 5.2.1', descricao: 'Concede uma ação adicional conforme as restrições e usos descritos no SRD.' },
  { id: 'guerreiro-mente-tatica', nome: 'Mente Tática', nivel: 2, origem: 'classe', origemId: 'guerreiro', modo: 'automatico', fonte: 'SRD 5.2.1' },
  { id: 'guerreiro-subclasse', nome: 'Subclasse de Guerreiro', nivel: 3, origem: 'subclasse', origemId: 'guerreiro', modo: 'escolha', fonte: 'SRD 5.2.1',
    descricao: 'O catálogo aberto inclui Campeão; outras opções do Livro do Jogador não estão implementadas neste patch.',
    opcoes: [{ id: 'campeao', nome: 'Campeão (SRD)' }] },
  { id: 'guerreiro-ataque-extra', nome: 'Ataque Extra', nivel: 5, origem: 'classe', origemId: 'guerreiro', modo: 'automatico', fonte: 'SRD 5.2.1' },
  { id: 'guerreiro-mudanca-tatica', nome: 'Mudança Tática', nivel: 5, origem: 'classe', origemId: 'guerreiro', modo: 'automatico', fonte: 'SRD 5.2.1' },
]
