/** D&D 2024 SRD 5.2.1 — Iniciado em Magia escolhido pelo Humano Versátil.
 * A origem humana é independente do talento do antecedente (inclusive usos de descanso).
 * Não duplica magias preparadas pela classe nem apaga escolhas ao trocar de espécie.
 */
import type { DadosFicha } from './tipos'
import { idDe } from './dnd2024Classes'
import { lerEscolhasDnd } from './dnd2024Ficha'
import { ANTECEDENTES_GUIADOS, lerRegistroAntecedenteDnd, type MagiasDeAntecedenteDnd } from './dnd2024Antecedentes'
import { MAGIAS_SRD } from './dnd2024Magias'

export type ListaIniciado = 'clerigo' | 'druida' | 'mago'
export type AtributoMagico = 'INT' | 'SAB' | 'CAR'
export type RegistroTalentoMagiaHumano = {
  lista: ListaIniciado
  atributo: AtributoMagico
  /** Primeiro e segundo IDs: truques; terceiro ID: magia de nível 1. */
  magias: [string, string, string]
}
const LISTAS: ListaIniciado[] = ['clerigo', 'druida', 'mago']
const ATRIBUTOS: AtributoMagico[] = ['INT', 'SAB', 'CAR']

/** Dados inválidos não são ativados; o servidor rejeita novos registros inválidos. */
export function lerTalentoMagiaHumano(v: unknown): RegistroTalentoMagiaHumano | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const r = v as Record<string, unknown>
  if (!LISTAS.includes(r.lista as ListaIniciado) || !ATRIBUTOS.includes(r.atributo as AtributoMagico) ||
    !Array.isArray(r.magias) || r.magias.length !== 3 ||
    r.magias.some(x => typeof x !== 'string' || !/^[a-z0-9-]{2,70}$/.test(x))) return null
  return { lista: r.lista as ListaIniciado, atributo: r.atributo as AtributoMagico,
    magias: [r.magias[0], r.magias[1], r.magias[2]] }
}

/** A lista do antecedente é reservada mesmo quando seu formulário ainda está pendente. */
export function listaIniciadoAntecedente(d: Pick<DadosFicha, 'campos' | 'dndAntecedente'>): ListaIniciado | null {
  const id = idDe(d.campos.antecedente)
  const def = ANTECEDENTES_GUIADOS[id]
  const r = lerRegistroAntecedenteDnd(d.dndAntecedente)
  const talento = id === 'forasteiro' ? (r?.id === id ? r.talento : undefined) : def?.talentoId
  if (!talento?.startsWith('iniciado-magia')) return null
  if (talento === 'iniciado-magia-clerigo') return 'clerigo'
  if (talento === 'iniciado-magia-druida') return 'druida'
  if (talento === 'iniciado-magia-mago') return 'mago'
  return r?.id === id ? r.talentoLista ?? null : null
}

type Estado = Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndAntecedente' | 'dndTalentoHumano'>
export function humanoTemIniciado(d: Pick<DadosFicha, 'campos' | 'dndEscolhas'>): boolean {
  return idDe(d.campos.especie) === 'humano' &&
    lerEscolhasDnd(d.dndEscolhas)['esp-humano-versatil'] === 'iniciado-magia'
}

export function validarTalentoMagiaHumano(d: Estado): string[] {
  const r = lerTalentoMagiaHumano(d.dndTalentoHumano)
  if (!r) return ['Humano Versátil: selecione lista, atributo, dois truques e uma magia de nível 1.']
  const erros: string[] = []
  if (listaIniciadoAntecedente(d) === r.lista)
    erros.push('Iniciado em Magia pode ser repetido apenas com uma lista de magias diferente da do antecedente.')
  if (new Set(r.magias).size !== 3 ||
    r.magias.some((id, i) => !MAGIAS_SRD.some(m => m.id === id && m.classes.includes(r.lista) && m.nivel === (i === 2 ? 1 : 0))))
    erros.push('Humano Versátil: escolha dois truques distintos e uma magia de nível 1 do catálogo da lista selecionada.')
  return erros
}

/** Só projeta escolhas confirmadas; não coloca os IDs em dndMagias. */
export function magiasDoHumanoDnd(d: Estado): MagiasDeAntecedenteDnd | null {
  if (!humanoTemIniciado(d) || validarTalentoMagiaHumano(d).length) return null
  const r = lerTalentoMagiaHumano(d.dndTalentoHumano)!
  return { antecedente: 'Humano Versátil', lista: r.lista, atributo: r.atributo, ids: r.magias }
}

/** Em mudanças de espécie/talento, mantém o registro histórico inativo e não bloqueia saves antigos. */
export function validarAlteracoesTalentoMagiaHumano(antes: Estado, depois: Estado): string[] {
  if (JSON.stringify(antes.dndTalentoHumano ?? null) === JSON.stringify(depois.dndTalentoHumano ?? null)) return []
  if (!humanoTemIniciado(depois))
    return ['O registro de Iniciado em Magia do Humano só pode ser alterado com Humano Versátil ativo.']
  return validarTalentoMagiaHumano(depois)
}
