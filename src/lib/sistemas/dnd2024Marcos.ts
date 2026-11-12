import type { MarcoDnd } from './dnd2024Progressao'
import { MARCOS_CLASSES_SRD } from './dnd2024Srd'
import { MARCOS_ORIGENS_SRD } from './dnd2024Origens'

/**
 * Marcos da progressão de D&D 2024 (v0.33.7): as 12 classes do SRD 5.2.1 de 1 a 20 com a subclasse aberta de cada uma,
 * as 9 espécies e os 4 antecedentes do SRD. Fonte de regras abertas: System Reference Document 5.2.1,
 * Wizards of the Coast LLC — https://www.dndbeyond.com/srd — CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
 *
 * IMPORTANTE: o catálogo é VISUAL e registra escolhas; não aplica efeitos sozinho. Os efeitos automáticos entram depois,
 * um a um e testados, sem bônus em dobro.
 */
export const MARCOS_DND_2024: MarcoDnd[] = [...MARCOS_CLASSES_SRD, ...MARCOS_ORIGENS_SRD]
