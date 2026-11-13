/** D&D 2024 (SRD 5.2.1): projeção das magias de linhagens e legados.
 * Não altera dndMagias (preparações de classe) e mantém cada uso gratuito em
 * um recurso específico da espécie. Tudo é derivado das escolhas oficiais.
 */
import type { DadosFicha } from './tipos'
import { idDe } from './dnd2024Classes'
import { lerEscolhasDnd } from './dnd2024Ficha'
import { magiaPorId } from './dnd2024Conjuracao'

export const RECURSOS_ESPECIE = {
  nivel3: 'magia_especie_3',
  nivel5: 'magia_especie_5',
  animais: 'magia_gnomo_animais',
} as const
export type RecursoMagiaEspecie = typeof RECURSOS_ESPECIE[keyof typeof RECURSOS_ESPECIE]
export type MagiaEspecie = {
  id: string
  /** Nível de personagem necessário para aprender a magia, não o círculo. */
  desbloqueia: number
  recurso?: RecursoMagiaEspecie
}
export type OrigemMagicaEspecie = {
  especie: 'elfo' | 'gnomo' | 'tiferino'
  linhagem: string
  atributo: 'INT' | 'SAB' | 'CAR'
  magias: MagiaEspecie[]
  observacao?: string
}

const atributos: Record<string, OrigemMagicaEspecie['atributo']> = {
  inteligencia: 'INT', sabedoria: 'SAB', carisma: 'CAR',
}
const magia = (id: string, desbloqueia = 1, recurso?: RecursoMagiaEspecie): MagiaEspecie =>
  ({ id, desbloqueia, ...(recurso ? { recurso } : {}) })
const elfo: Record<string, { nome: string; magias: MagiaEspecie[]; observacao?: string }> = {
  drow: { nome: 'Drow', magias: [
    magia('dancing-lights'), magia('faerie-fire', 3, RECURSOS_ESPECIE.nivel3),
    magia('darkness', 5, RECURSOS_ESPECIE.nivel5),
  ] },
  'alto-elfo': { nome: 'Alto Elfo', magias: [
    magia('prestidigitation'), magia('detect-magic', 3, RECURSOS_ESPECIE.nivel3),
    magia('misty-step', 5, RECURSOS_ESPECIE.nivel5),
  ], observacao: 'O truque Prestidigitação pode ser substituído por um truque da lista de Mago ao concluir um descanso longo. A troca ainda deve ser anotada com o mestre.' },
  'elfo-floresta': { nome: 'Elfo da Floresta', magias: [
    magia('druidcraft'), magia('longstrider', 3, RECURSOS_ESPECIE.nivel3),
    magia('pass-without-trace', 5, RECURSOS_ESPECIE.nivel5),
  ] },
}
const gnomo: Record<string, { nome: string; magias: MagiaEspecie[]; observacao?: string }> = {
  floresta: { nome: 'Gnomo da Floresta', magias: [
    magia('minor-illusion'), magia('speak-with-animals', 1, RECURSOS_ESPECIE.animais),
  ] },
  rochas: { nome: 'Gnomo das Rochas', magias: [
    magia('mending'), magia('prestidigitation'),
  ], observacao: 'Engenhocas criadas com Prestidigitação ainda exigem controle narrativo do mestre: até três dispositivos, cada um dura oito horas.' },
}
const tiferino: Record<string, { nome: string; magias: MagiaEspecie[] }> = {
  abissal: { nome: 'Legado Abissal', magias: [
    magia('thaumaturgy'), magia('poison-spray'),
    magia('ray-of-sickness', 3, RECURSOS_ESPECIE.nivel3),
    magia('hold-person', 5, RECURSOS_ESPECIE.nivel5),
  ] },
  ctonico: { nome: 'Legado Ctônico', magias: [
    magia('thaumaturgy'), magia('chill-touch'),
    magia('false-life', 3, RECURSOS_ESPECIE.nivel3),
    magia('ray-of-enfeeblement', 5, RECURSOS_ESPECIE.nivel5),
  ] },
  infernal: { nome: 'Legado Infernal', magias: [
    magia('thaumaturgy'), magia('fire-bolt'),
    magia('hellish-rebuke', 3, RECURSOS_ESPECIE.nivel3),
    magia('darkness', 5, RECURSOS_ESPECIE.nivel5),
  ] },
}

type FichaEspecie = Pick<DadosFicha, 'campos' | 'dndEscolhas'>
/** Se falta linhagem ou atributo, nenhuma magia é liberada por suposição. */
export function magiasDaEspecieDnd(d: FichaEspecie): OrigemMagicaEspecie | null {
  const especie = idDe(d.campos.especie)
  if (!['elfo', 'gnomo', 'tiferino'].includes(especie)) return null
  const escolhas = lerEscolhasDnd(d.dndEscolhas)
  const atributo = atributos[escolhas['esp-' + especie + '-atributo-magia']]
  const chave = especie === 'tiferino' ? 'esp-tiferino-legado' : 'esp-' + especie + '-linhagem'
  const linhagemId = escolhas[chave]
  if (!linhagemId) return null
  const tabela = especie === 'elfo' ? elfo : especie === 'gnomo' ? gnomo : tiferino
  const l = tabela[linhagemId]
  if (!atributo || !l) return null
  const nivel = Math.max(1, Math.min(20, Math.floor(Number(d.campos.nivel) || 1)))
  const magias = l.magias.filter(m => m.desbloqueia <= nivel && !!magiaPorId(m.id))
  return { especie: especie as OrigemMagicaEspecie['especie'], linhagem: l.nome, atributo, magias,
    ...('observacao' in l && l.observacao ? { observacao: l.observacao } : {}),
  }
}

/** Contadores específicos: o Gnomo Floresta tem proficiência/descanso longo;
 * Elfo e Tiferino têm um uso para cada magia concedida nos níveis 3 e 5.
 * Trocar espécie ou linhagem suspende os recursos sem apagar o histórico.
 */
export function maximosMagiaEspecieDnd(d: FichaEspecie, proficiencia: number): Record<RecursoMagiaEspecie, number> {
  const p: Record<RecursoMagiaEspecie, number> = {
    [RECURSOS_ESPECIE.nivel3]: 0,
    [RECURSOS_ESPECIE.nivel5]: 0,
    [RECURSOS_ESPECIE.animais]: 0,
  }
  const magias = magiasDaEspecieDnd(d)
  if (!magias) return p
  for (const m of magias.magias) if (m.recurso)
    p[m.recurso] = m.recurso === RECURSOS_ESPECIE.animais
      ? Math.max(2, Math.min(6, Math.floor(proficiencia))) : 1
  return p
}
