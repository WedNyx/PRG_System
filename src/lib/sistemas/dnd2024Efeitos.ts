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
import { classesDaFicha, espacosDeMagia } from './dnd2024Classes'
import { progressoDaFichaDnd, lerEscolhasDnd } from './dnd2024Ficha'
import { ANTECEDENTES_GUIADOS, PERICIAS_DND_ORIGENS, lerRegistroAntecedenteDnd, magiasDeAntecedenteDnd } from './dnd2024Antecedentes'
import { magiasDoHumanoDnd } from './dnd2024MagiaHumano'
import { maximosMagiaEspecieDnd, RECURSOS_ESPECIE } from './dnd2024MagiasEspecie'

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
  'dnd_inimigo', 'dnd_truques', 'dnd_preparadas', 'dnd_pacto', 'dnd_pacto_nivel', 'dnd_furtivo', 'dnd_sorte', 'dnd_origem_magia_gratis', 'dnd_humano_magia_gratis', 'dnd_especie_magia_3', 'dnd_especie_magia_5', 'dnd_gnomo_animais',
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => 'dnd_espacos_' + n)] as const

const SAVES = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR']
/** Id da salvaguarda na ficha (resist_forca…). */
const SALVA: Record<string, string> = { FOR: 'resist_forca', DES: 'resist_destreza', CON: 'resist_constituicao', INT: 'resist_inteligencia', SAB: 'resist_sabedoria', CAR: 'resist_carisma' }
/** Número da coluna da tabela (“2”, “+3”, “1d6”, “+10 ft.”, “—”). */
const numero = (v: string | undefined) => { const m = (v ?? '').match(/(\d+)/); return m ? Number(m[1]) : 0 }

export function efeitosDnd2024(d: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMulticlasse' | 'dndAntecedente' | 'dndTalentoHumano'>, vars: Record<string, number>): EfeitosDnd {
  const v: Record<string, number> = Object.fromEntries(VARS_DND.map(k => [k, 0]))
  const treino: EfeitosDnd['treino'] = {}, bonus: EfeitosDnd['bonus'] = {}
  const p = progressoDaFichaDnd(d)
  const escolhas = lerEscolhasDnd(d.dndEscolhas)
  const { total, lista } = classesDaFicha(d)
  const prof = Math.floor((total - 1) / 4) + 2
  v.dnd_nivel = total; v.dnd_prof = prof
  const mod = (a: string) => Number(vars['mod_' + a]) || 0
  const dar = (id: string, t: Treino, fonte: string) => { if (!treino[id] || (t === 'especialista' && treino[id].treino !== 'especialista')) treino[id] = { treino: t, fonte } }
  const somar = (id: string, valor: number, fonte: string) => { bonus['pericia:' + id] = { valor: (bonus['pericia:' + id]?.valor ?? 0) + valor, fonte } }
  const escolheu = (sufixo: string, opcao: string) => Object.entries(escolhas).some(([k, o]) => k.endsWith(sufixo) && o === opcao)
  /** Nível numa classe (0 se não tem). */
  const em = (id: string) => lista.find(c => c.cls.id === id)?.nivel ?? 0
  let meia = 0
  const semArmadura = (Number(vars.ca_base) || 0) <= 10
  const pesada = (Number(vars.des_max) || 0) === 0 && (Number(vars.ca_base) || 0) > 10
  const extrasCa: number[] = []

  for (const c of lista) {
    const { cls, nivel } = c
    const col = (nome: string) => cls.colunas[nome]?.[nivel - 1]
    // Salvaguardas: só da classe inicial (quem entra numa classe por multiclasse não ganha as dela).
    if (c.principal) {
      for (const a of cls.salvaguardas) dar(SALVA[a], 'proficiente', cls.nome)
      // Perícias da classe inicial são escolhidas e persistidas nos marcos oficiais.
      for (let i = 1; i <= cls.pericias.qtd; i++) {
        const pericia = escolhas[`${cls.id}-pericia-${i}`]
        if (pericia && cls.pericias.opcoes.includes(pericia)) dar(pericia, 'proficiente', cls.nome + ' (classe inicial)')
      }
    }
    // Recursos pela tabela de cada classe, no nível daquela classe.
    v.dnd_furias += numero(col('Fúrias')); v.dnd_dano_furia = Math.max(v.dnd_dano_furia, numero(col('Dano da Fúria')))
    v.dnd_canalizar += numero(col('Canalizar Divindade')); v.dnd_forma_selvagem += numero(col('Forma Selvagem'))
    v.dnd_retomar += numero(col('Retomar o Fôlego')); v.dnd_foco += numero(col('Pontos de Foco')); v.dnd_feiticaria += numero(col('Pontos de Feitiçaria'))
    v.dnd_inimigo += numero(col('Inimigo Favorito')); v.dnd_truques += numero(col('Truques')); v.dnd_preparadas += numero(col('Magias preparadas'))
    v.dnd_furtivo += numero(col('Ataque Furtivo'))
    if (cls.id === 'monge' && semArmadura && !(Number(vars.armadura) > 0)) v.dnd_desl_extra += numero(col('Movimento sem armadura')) / 10 * 3
  }
  if (em('monge') >= 14) for (const a of SAVES) dar(SALVA[a], 'proficiente', 'Sobrevivente Disciplinado')
  if (em('ladino') >= 15) { dar(SALVA.SAB, 'proficiente', 'Mente Escorregadia'); dar(SALVA.CAR, 'proficiente', 'Mente Escorregadia') }
  // Espaços de magia: tabela da classe, ou a de multiclasse com duas ou mais classes conjuradoras.
  const esp = espacosDeMagia(lista)
  for (let n = 1; n <= 9; n++) v['dnd_espacos_' + n] = esp.espacos[n]
  v.dnd_pacto = esp.pacto; v.dnd_pacto_nivel = esp.pactoNivel
  if (em('bardo')) v.dnd_inspiracao = Math.max(1, mod('CAR'))
  const g = em('guerreiro'); v.dnd_surto = g >= 17 ? 2 : g >= 2 ? 1 : 0; v.dnd_indomavel = g >= 17 ? 3 : g >= 13 ? 2 : g >= 9 ? 1 : 0
  v.dnd_cura_maos = 5 * em('paladino')
  // Pau para Toda Obra (Bardo 2+): metade da proficiência nas perícias sem proficiência
  if (em('bardo') >= 2) meia = Math.floor(prof / 2)
  // Ordem Divina / Ordem Primal: Sabedoria (mín. +1) em duas perícias
  if (em('clerigo') && escolheu('-ordem-divina', 'taumaturgo')) for (const id of ['arcanismo', 'religiao']) somar(id, Math.max(1, mod('SAB')), 'Ordem Divina (Taumaturgo)')
  if (em('druida') && escolheu('-ordem-primal', 'magico')) for (const id of ['arcanismo', 'natureza']) somar(id, Math.max(1, mod('SAB')), 'Ordem Primal (Mágico)')
  // Defesa sem Armadura (sem armadura: CA base 10) e Resiliência Dracônica — só uma vale; fica a melhor.
  if (semArmadura && em('barbaro')) extrasCa.push(mod('CON'))
  if (semArmadura && em('monge') && !(Number(vars.armadura) > 0)) extrasCa.push(mod('SAB'))
  const draconico = em('feiticeiro') >= 3 && escolhas['feiticeiro-subclasse'] === 'feiticaria-draconica'
  if (semArmadura && draconico) extrasCa.push(mod('CAR'))
  v.dnd_ca_extra = extrasCa.length ? Math.max(0, ...extrasCa) : 0
  if (draconico) v.dnd_pv_extra += em('feiticeiro')
  // PV na multiclasse: a fórmula usa o dado da classe inicial; cada nível de outra classe usa a média do dado dela.
  const principal = lista.find(c => c.principal)
  if (principal) for (const c of lista) if (!c.principal) v.dnd_pv_extra += c.nivel * ((Math.floor(c.cls.dv / 2) + 1) - (Math.floor(principal.cls.dv / 2) + 1))
  // Deslocamento
  if (em('barbaro') >= 5 && !pesada) v.dnd_desl_extra += 3
  if (em('patrulheiro') >= 6 && !pesada) v.dnd_desl_extra += 3
  if (p.especieId === 'elfo' && escolhas['esp-elfo-linhagem'] === 'elfo-floresta') v.dnd_desl_extra += 1.5
  // Antecedentes PHB/SRD: proficiências fixas só como MÍNIMO, sem acumular bônus.
  const antecedente = ANTECEDENTES_GUIADOS[p.antecedenteId ?? '']
  const registro = lerRegistroAntecedenteDnd(d.dndAntecedente)
  const registrado = registro?.id === p.antecedenteId ? registro : null
  if (antecedente) for (const id of antecedente.pericias)
    dar(id, 'proficiente', antecedente.nome)
  const talento = antecedente?.id === 'forasteiro' ? registrado?.talento : antecedente?.talentoId
  // Habilidoso: três perícias ou ferramentas; só as perícias escolhidas entram nos cálculos.
  if (talento === 'habilidoso' && registrado) for (const id of registrado.talentoPericias ?? [])
    if (PERICIAS_DND_ORIGENS.includes(id as typeof PERICIAS_DND_ORIGENS[number]))
      dar(id, 'proficiente', 'Habilidoso (' + antecedente.nome + ')')
  // Talentos de origem numéricos. Cada talento atua uma vez mesmo que venha de duas fontes.
  const humano = p.especieId === 'humano' ? escolhas['esp-humano-versatil'] : null
  const temTalento = (id: string) => talento === id || humano === id
  if (temTalento('tough')) v.dnd_pv_extra += 2 * total
  if (temTalento('lucky')) v.dnd_sorte = prof
  if (magiasDeAntecedenteDnd(d)) v.dnd_origem_magia_gratis = 1
  if (magiasDoHumanoDnd(d)) v.dnd_humano_magia_gratis = 1
  const maxEspecie = maximosMagiaEspecieDnd(d, prof)
  v.dnd_especie_magia_3 = maxEspecie[RECURSOS_ESPECIE.nivel3]
  v.dnd_especie_magia_5 = maxEspecie[RECURSOS_ESPECIE.nivel5]
  v.dnd_gnomo_animais = maxEspecie[RECURSOS_ESPECIE.animais]
  const sentidos = escolhas['esp-elfo-sentidos']
  if (p.especieId === 'elfo' && sentidos) dar(sentidos, 'proficiente', 'Sentidos Aguçados')
  const periciaHumano = escolhas['esp-humano-habilidoso']
  if (p.especieId === 'humano' && periciaHumano) dar(periciaHumano, 'proficiente', 'Habilidoso (Humano)')
  // Talento Alerta: proficiência na Iniciativa (antecedente Criminoso, Humano Versátil ou talento escolhido)
  if (temTalento('alerta')) v.dnd_ini_extra = prof
  return { vars: v, treino, bonus, meiaProficiencia: meia }
}
