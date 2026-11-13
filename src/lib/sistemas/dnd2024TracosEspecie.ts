/**
 * D&D 2024 SRD 5.2.1 — traços de espécie projetados na ficha.
 * Fonte: https://www.dndbeyond.com/srd (Wizards of the Coast LLC, CC BY 4.0).
 *
 * Os poderes derivados NÃO são gravados em d.poderes: mudar a espécie ou o
 * nível recalcula a lista, sem duplicar nem apagar poderes personalizados.
 * Os usos são armazenados no registro d.uso.poderes (pelo id estável).
 */
import type { DadosFicha } from './tipos'
import { lerEscolhasDnd, progressoDaFichaDnd } from './dnd2024Ficha'
import { idDe } from './dnd2024Classes'
import { MARCOS_ORIGENS_SRD } from './dnd2024Origens'
import { progressaoVisivel, type MarcoVisivel } from './dnd2024Progressao'
import { MAGIAS_SRD } from './dnd2024Magias'

export const CHAVE_TRUQUE_ALTO_ELFO = 'dnd_alto_elfo_truque'
export const CHAVE_ENGENHOCAS_GNOMO = 'dnd_gnomo_engenhocas'
export type DadosEspecieDnd = Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMulticlasse' | 'listas'>
export type PoderUsavelEspecie = {
  id: string; nome: string; usosMax: number; recarga: 'curto' | 'longo'
  descricao: string; expressao?: string
}

/** Apenas truques efetivamente presentes na lista de magias do Mago do SRD aberto. */
export const TRUQUES_MAGO_ALTO_ELFO = MAGIAS_SRD
  .filter(m => m.nivel === 0 && m.classes.includes('mago'))
  .map(m => ({ id: m.id, nome: m.nome }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

type DadosTruqueAltoElfo = Pick<DadosFicha, 'campos' | 'dndEscolhas'> & { listas?: DadosFicha['listas'] }

export const altoElfoSelecionado = (d: DadosTruqueAltoElfo): boolean =>
  idDe(d.campos.especie) === 'elfo' && lerEscolhasDnd(d.dndEscolhas)['esp-elfo-linhagem'] === 'alto-elfo'

export function truqueAltoElfo(d: DadosTruqueAltoElfo): string {
  if (!altoElfoSelecionado(d)) return 'prestidigitation'
  const registrado = d.listas?.[CHAVE_TRUQUE_ALTO_ELFO]
  return typeof registrado === 'string' && TRUQUES_MAGO_ALTO_ELFO.some(x => x.id === registrado) ? registrado : 'prestidigitation'
}

/** Registro simples; o tempo de duração é *tempo de campanha*, não relógio real. */
export function lerEngenhocasGnomicas(valor: unknown): string[] {
  if (typeof valor !== 'string' || !valor || valor.length > 600) return []
  try {
    const lista: unknown = JSON.parse(valor)
    return Array.isArray(lista) ? lista.slice(0, 3).filter((x): x is string =>
      typeof x === 'string' && x.trim().length > 0 && x.trim().length <= 90).map(x => x.trim()) : []
  } catch { return [] }
}

/** Todos os traços ativos até o nível atual, indicando escolhas e pré-requisitos. */
export function tracosDeEspecieDnd(d: DadosEspecieDnd): MarcoVisivel[] {
  const p = progressoDaFichaDnd(d)
  if (!p.especieId) return []
  return progressaoVisivel(MARCOS_ORIGENS_SRD.filter(m => m.origem === 'especie'), p)
    .filter(x => x.estado !== 'futuro')
}
export const especieEscolhidaDnd = (d: DadosEspecieDnd): string => idDe(d.campos.especie)

const escolher = (v: number, minimo: number, maximo: number) => Math.max(minimo, Math.min(maximo, Math.floor(v)))
export function poderesUsaveisEspecieDnd(d: DadosEspecieDnd): PoderUsavelEspecie[] {
  const especie = especieEscolhidaDnd(d)
  const escolha = lerEscolhasDnd(d.dndEscolhas)
  const nivel = escolher(Number(d.campos.nivel) || 1, 1, 20)
  const prof = escolher(2 + Math.floor((nivel - 1) / 4), 2, 6)
  const poderes: PoderUsavelEspecie[] = []
  const adicionar = (id: string, nome: string, usosMax: number, recarga: 'curto' | 'longo', descricao: string, expressao?: string) =>
    poderes.push({ id: 'especie-srd-' + id, nome, usosMax, recarga, descricao, ...(expressao ? { expressao } : {}) })

  if (especie === 'anao') adicionar('anao-pedra', 'Conhecimento de Pedra', prof, 'longo',
    'Ação Bônus: sentido sísmico por 10 minutos em superfície de pedra; alcance 18 m.')
  if (especie === 'draconato') {
    const dado = nivel >= 17 ? '4d10' : nivel >= 11 ? '3d10' : nivel >= 5 ? '2d10' : '1d10'
    const ancestral = escolha['esp-draconato-ancestral']
    const tipos: Record<string, string> = { preto: 'Ácido', azul: 'Elétrico', latao: 'Fogo', bronze: 'Elétrico',
      cobre: 'Ácido', ouro: 'Fogo', verde: 'Veneno', vermelho: 'Fogo', prata: 'Frio', branco: 'Frio' }
    adicionar('draconato-sopro', 'Arma de Sopro', prof, 'longo',
      'Substitui um ataque: cone de 4,5 m ou linha de 9 m. CD 8 + CON + proficiência; resistência de Destreza; ' +
      (tipos[ancestral] ? 'dano ' + tipos[ancestral] + '.' : 'escolha seu ancestral dracônico na progressão.'), dado)
    if (nivel >= 5) adicionar('draconato-voo', 'Voo Dracônico', 1, 'longo',
      'Ação Bônus: asas espectrais, voo por 10 minutos.')
  }
  if (especie === 'golias') {
    const ancestral = escolha['esp-golias-ancestralidade']
    if (ancestral) {
      const dados: Record<string, string> = { fogo: '1d10', gelo: '1d6', pedra: '1d12', tempestade: '1d8' }
      const texto: Record<string, string> = {
        nuvem: 'Teletransporte de até 9 m como Ação Bônus.',
        fogo: 'Ao acertar um ataque, acrescenta 1d10 de dano de fogo.',
        gelo: 'Acrescenta 1d6 de frio e reduz deslocamento do alvo em 3 m.',
        colina: 'Ao acertar, pode derrubar o alvo.',
        pedra: 'Como Reação, reduz dano em 1d12 + modificador de Constituição.',
        tempestade: 'Como Reação, causa 1d8 trovejante em quem acabou de te ferir.',
      }
      const op = texto[ancestral]
      if (op) adicionar('golias-ancestral', 'Ancestralidade Gigante', prof, 'longo', op, dados[ancestral])
    }
    if (nivel >= 5) adicionar('golias-grande', 'Forma Grande', 1, 'longo',
      'Ação Bônus: por 10 minutos, tamanho Grande, vantagem em testes de Força e deslocamento +3 m.')
  }
  if (especie === 'orc') {
    adicionar('orc-adrenalina', 'Pico de Adrenalina', prof, 'curto',
      'Ação Bônus de Disparada e PV temporários iguais ao bônus de proficiência.')
    adicionar('orc-implacavel', 'Resistência Implacável', 1, 'longo',
      'Ao chegar a 0 PV sem morrer imediatamente, permanece com 1 PV.')
  }
  return poderes
}

/** Contadores com descanso próprio; não mexer em poderes de outras espécies ou caseiros. */
export function idsRecuperadosEspecieDnd(d: DadosEspecieDnd, tipo: 'curto' | 'longo'): string[] {
  return poderesUsaveisEspecieDnd(d).filter(p => tipo === 'longo' || p.recarga === 'curto').map(p => p.id)
}
