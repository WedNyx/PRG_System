/**
 * D&D 2024 — efeitos automáticos da progressão (v0.33.6). Fonte: SRD 5.2.1 (CC BY 4.0).
 *
 * Regras para nunca dar bônus em dobro:
 *  - Proficiências viram um MÍNIMO (se a pessoa já marcou Proficiente ou Especialista, nada muda).
 *  - Bônus numéricos só vêm de características que a ficha não tem como digitar em outro lugar
 *    (Pau para Toda Obra, Ordem Divina/Primal, Defesa sem Armadura…) e cada um tem uma variável própria.
 *  - Aumentos permanentes de atributo (Campeão Primal, Corpo e Mente, Aumento de Atributo) NÃO são aplicados:
 *    o valor do atributo é digitado pela pessoa, e somar aqui duplicaria.
 */
import type { DadosFicha } from './tipos'
import { CLASSES_SRD } from './dnd2024Srd'
import { progressoDaFichaDnd, lerEscolhasDnd } from './dnd2024Ficha'

export type Treino = 'proficiente' | 'especialista'
export type EfeitosDnd = {
  /** Variáveis usadas pelas fórmulas da ficha de D&D (sempre presentes; 0 quando não se aplica). */
  vars: Record<string, number>
  /** Perícia/salvaguarda → treino mínimo dado pela regra, e de onde veio. */
  treino: Record<string, { treino: Treino; fonte: string }>
  /** Bônus somados ao total de perícias (alvo 'pericia:<id>') com a fonte. */
  bonus: Record<string, { valor: number; fonte: string }>
  /** Meio bônus de proficiência nas perícias sem proficiência (Pau para Toda Obra). */
  meiaProficiencia: number
}

/** Variáveis que as fórmulas do D&D podem usar (o construtor de sistemas também as conhece). */
export const VARS_DND = ['dnd_nivel', 'dnd_prof', 'dnd_ca_extra', 'dnd_pv_extra', 'dnd_ini_extra', 'dnd_desl_extra', 'dnd_furias', 'dnd_dano_furia',
  'dnd_inspiracao', 'dnd_canalizar', 'dnd_forma_selvagem', 'dnd_retomar', 'dnd_surto', 'dnd_indomavel', 'dnd_foco', 'dnd_feiticaria', 'dnd_cura_maos',
  'dnd_inimigo', 'dnd_truques', 'dnd_preparadas', 'dnd_pacto', 'dnd_pacto_nivel', 'dnd_furtivo',
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => 'dnd_espacos_' + n)] as const

const SAVES = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR']
/** Id da salvaguarda na ficha (resist_forca…). */
const SALVA: Record<string, string> = { FOR: 'resist_forca', DES: 'resist_destreza', CON: 'resist_constituicao', INT: 'resist_inteligencia', SAB: 'resist_sabedoria', CAR: 'resist_carisma' }
const PERICIAS_ANTECEDENTE: Record<string, string[]> = { acolito: ['intuicao', 'religiao'], criminoso: ['prestidigitacao', 'furtividade'], sabio: ['arcanismo', 'historia'], soldado: ['atletismo', 'intimidacao'] }
const NOME_ANTECEDENTE: Record<string, string> = { acolito: 'Acólito', criminoso: 'Criminoso', sabio: 'Sábio', soldado: 'Soldado' }
/** Número da coluna da tabela (“2”, “+3”, “1d6”, “+10 ft.”, “—”). */
const numero = (v: string | undefined) => { const m = (v ?? '').match(/(\d+)/); return m ? Number(m[1]) : 0 }

export function efeitosDnd2024(d: Pick<DadosFicha, 'campos' | 'dndEscolhas'>, vars: Record<string, number>): EfeitosDnd {
  const v: Record<string, number> = Object.fromEntries(VARS_DND.map(k => [k, 0]))
  const treino: EfeitosDnd['treino'] = {}, bonus: EfeitosDnd['bonus'] = {}
  const p = progressoDaFichaDnd(d)
  const escolhas = lerEscolhasDnd(d.dndEscolhas)
  const [classeId, nivelClasse] = Object.entries(p.nivelPorClasse)[0] ?? ['', 0]
  const cls = CLASSES_SRD.find(c => c.id === classeId)
  const nivel = Math.max(1, Math.min(20, nivelClasse || 1))
  const prof = Math.floor((nivel - 1) / 4) + 2
  v.dnd_nivel = nivel; v.dnd_prof = prof
  const mod = (a: string) => Number(vars['mod_' + a]) || 0
  const dar = (id: string, t: Treino, fonte: string) => { if (!treino[id] || (t === 'especialista' && treino[id].treino !== 'especialista')) treino[id] = { treino: t, fonte } }
  const somar = (id: string, valor: number, fonte: string) => { bonus['pericia:' + id] = { valor: (bonus['pericia:' + id]?.valor ?? 0) + valor, fonte } }
  const escolheu = (sufixo: string, opcao: string) => Object.entries(escolhas).some(([k, o]) => k.endsWith(sufixo) && o === opcao)
  let meia = 0

  if (cls) {
    const col = (nome: string) => cls.colunas[nome]?.[nivel - 1]
    // Salvaguardas da classe
    for (const a of cls.salvaguardas) dar(SALVA[a], 'proficiente', cls.nome)
    if (cls.id === 'monge' && nivel >= 14) for (const a of SAVES) dar(SALVA[a], 'proficiente', 'Sobrevivente Disciplinado')
    if (cls.id === 'ladino' && nivel >= 15) { dar(SALVA.SAB, 'proficiente', 'Mente Escorregadia'); dar(SALVA.CAR, 'proficiente', 'Mente Escorregadia') }
    // Recursos pela tabela da classe
    v.dnd_furias = numero(col('Fúrias')); v.dnd_dano_furia = numero(col('Dano da Fúria'))
    v.dnd_canalizar = numero(col('Canalizar Divindade')); v.dnd_forma_selvagem = numero(col('Forma Selvagem'))
    v.dnd_retomar = numero(col('Retomar o Fôlego')); v.dnd_foco = numero(col('Pontos de Foco')); v.dnd_feiticaria = numero(col('Pontos de Feitiçaria'))
    v.dnd_inimigo = numero(col('Inimigo Favorito')); v.dnd_truques = numero(col('Truques')); v.dnd_preparadas = numero(col('Magias preparadas'))
    v.dnd_furtivo = numero(col('Ataque Furtivo'))
    for (let n = 1; n <= 9; n++) v['dnd_espacos_' + n] = numero(col(`Espaços de ${n}º nível`))
    if (cls.id === 'bruxo') { v.dnd_pacto = numero(col('Espaços de magia')); v.dnd_pacto_nivel = numero(col('Nível dos espaços')) }
    if (cls.id === 'bardo') v.dnd_inspiracao = Math.max(1, mod('CAR'))
    if (cls.id === 'guerreiro') { v.dnd_surto = nivel >= 17 ? 2 : nivel >= 2 ? 1 : 0; v.dnd_indomavel = nivel >= 17 ? 3 : nivel >= 13 ? 2 : nivel >= 9 ? 1 : 0 }
    if (cls.id === 'paladino') v.dnd_cura_maos = 5 * nivel
    // Pau para Toda Obra (Bardo 2+): metade da proficiência nas perícias sem proficiência
    if (cls.id === 'bardo' && nivel >= 2) meia = Math.floor(prof / 2)
    // Ordem Divina / Ordem Primal: Sabedoria (mín. +1) em duas perícias
    if (escolheu('-ordem-divina', 'taumaturgo')) for (const id of ['arcanismo', 'religiao']) somar(id, Math.max(1, mod('SAB')), 'Ordem Divina (Taumaturgo)')
    if (escolheu('-ordem-primal', 'magico')) for (const id of ['arcanismo', 'natureza']) somar(id, Math.max(1, mod('SAB')), 'Ordem Primal (Mágico)')
    // Defesa sem Armadura (sem armadura: CA base 10) e Resiliência Dracônica
    const semArmadura = (Number(vars.ca_base) || 0) <= 10
    const extras: number[] = []
    if (semArmadura && cls.id === 'barbaro') extras.push(mod('CON'))
    if (semArmadura && cls.id === 'monge' && !(Number(vars.armadura) > 0)) extras.push(mod('SAB'))
    const draconico = cls.id === 'feiticeiro' && nivel >= 3 && escolhas['feiticeiro-subclasse'] === 'feiticaria-draconica'
    if (semArmadura && draconico) extras.push(mod('CAR'))
    v.dnd_ca_extra = extras.length ? Math.max(0, ...extras) : 0
    if (draconico) v.dnd_pv_extra = nivel
    // Deslocamento
    const pesada = (Number(vars.des_max) || 0) === 0 && (Number(vars.ca_base) || 0) > 10
    if (cls.id === 'barbaro' && nivel >= 5 && !pesada) v.dnd_desl_extra += 3
    if (cls.id === 'patrulheiro' && nivel >= 6 && !pesada) v.dnd_desl_extra += 3
    if (cls.id === 'monge' && semArmadura && !(Number(vars.armadura) > 0)) v.dnd_desl_extra += numero(col('Movimento sem armadura')) / 10 * 3
  }
  if (p.especieId === 'elfo' && escolhas['esp-elfo-linhagem'] === 'elfo-floresta') v.dnd_desl_extra += 1.5
  // Perícias do antecedente e da espécie
  for (const id of PERICIAS_ANTECEDENTE[p.antecedenteId ?? ''] ?? []) dar(id, 'proficiente', NOME_ANTECEDENTE[p.antecedenteId!])
  const sentidos = escolhas['esp-elfo-sentidos']
  if (p.especieId === 'elfo' && sentidos) dar(sentidos, 'proficiente', 'Sentidos Aguçados')
  // Talento Alerta: proficiência na Iniciativa (antecedente Criminoso, Humano Versátil ou talento escolhido)
  if (p.antecedenteId === 'criminoso' || Object.values(escolhas).includes('alerta')) v.dnd_ini_extra = prof
  return { vars: v, treino, bonus, meiaProficiencia: meia }
}
