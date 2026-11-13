/** Perícias iniciais das classes SRD D&D 2024.
 * As escolhas ficam em dndEscolhas (marcos da progressão), não em um campo
 * livre sem validação. Apenas a classe INICIAL escolhe o pacote completo.
 * Fonte: SRD 5.2.1 (Wizards of the Coast, CC BY 4.0).
 */
import { CLASSES_SRD } from './dnd2024Srd'
import type { MarcoDnd } from './dnd2024Progressao'
import type { DadosFicha } from './tipos'

export const nomePericiaDnd = (id: string): string =>
  id.replaceAll('_', ' ').replace(/(^|\s)\p{L}/gu, s => s.toLocaleUpperCase('pt-BR'))

export const MARCOS_PERICIAS_CLASSE_DND: MarcoDnd[] = CLASSES_SRD.flatMap(c =>
  Array.from({ length: c.pericias.qtd }, (_, i): MarcoDnd => ({
    id: `${c.id}-pericia-${i + 1}`,
    nome: `Perícia de classe ${i + 1}/${c.pericias.qtd}`,
    nivel: 1, origem: 'classe', origemId: c.id, inicialApenas: true,
    modo: 'escolha', fonte: 'SRD 5.2.1 (CC BY 4.0)',
    descricao: 'Escolha uma perícia da lista da sua classe inicial. Evite repetir perícias já concedidas pelo antecedente ou por outra escolha.',
    opcoes: c.pericias.opcoes.map(id => ({ id, nome: nomePericiaDnd(id) })),
  })))

export function periciasClasseDnd(d: Pick<DadosFicha, 'campos' | 'dndEscolhas'>): string[] {
  const classe = CLASSES_SRD.find(c => c.nome === d.campos.classe)
  if (!classe) return []
  const escolhas = d.dndEscolhas && typeof d.dndEscolhas === 'object' && !Array.isArray(d.dndEscolhas)
    ? d.dndEscolhas : {}
  return Array.from({ length: classe.pericias.qtd }, (_, i) => escolhas[`${classe.id}-pericia-${i + 1}`])
    .filter((id): id is string => !!id && classe.pericias.opcoes.includes(id))
}
