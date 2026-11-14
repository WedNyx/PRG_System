/**
 * Hexágonos oficiais de D&D são projeções de regras/decisões existentes.
 * NUNCA são inseridos em dados.arvore nem geram bônus automaticamente:
 * os efeitos vêm do motor da edição, e hexágonos extras do mestre permanecem
 * separados para não conceder proficiências/recursos duas vezes.
 */
import type { DadosFicha } from './tipos'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { progressoDaFichaDnd } from './dnd2024Ficha'
import { progressaoVisivel } from './dnd2024Progressao'
import { ANTECEDENTES_2014, RACAS_2014, SUBRACAS_2014 } from './dnd2014Criacao'
import { lerLivrosDnd, type LivroBaseDnd } from './dndLivros'
import { fontePermitida, FONTE_LEGADO_2014, FONTE_PHB } from './dnd2024Fontes'

export type RamoHexDnd = 'classe' | 'especie' | 'antecedente' | 'mestre'
export type EstadoHexDnd = 'recebido' | 'pendente' | 'referencia' | 'futuro'
export type HexagonoDnd = {
  id: string; titulo: string; descricao: string
  nivel: number; ramo: RamoHexDnd; estado: EstadoHexDnd
  livro: string; escolha?: string
}
export const RAMOS_HEX_DND: { id: RamoHexDnd; titulo: string; icone: string; cor: string }[] = [
  { id: 'classe', titulo: 'Classe e subclasse', icone: '⚔️', cor: '#73c5f6' },
  { id: 'especie', titulo: 'Espécie / raça', icone: '🧬', cor: '#c4a0fc' },
  { id: 'antecedente', titulo: 'Origem e antecedente', icone: '📜', cor: '#f2bf69' },
  { id: 'mestre', titulo: 'Habilidades adicionais do mestre', icone: '🌠', cor: '#7edac0' },
]
const s = (v: unknown): string => typeof v === 'string' ? v : ''
const fonteComercial = (f: string): boolean => !f.startsWith('SRD')
const fonteVisivel = (f: string, permitidas: Set<string> | null): boolean =>
  !fonteComercial(f) ||
  (f.includes('2014') && fontePermitida(FONTE_LEGADO_2014, permitidas)) ||
  (f.includes('2024') && fontePermitida(FONTE_PHB, permitidas))

/** O mestre libera publicações na campanha, mas só publicações escolhidas na ficha
 * devem alimentar os hexágonos próprios do personagem.
 */
export function hexagonosOficiaisDnd(
  d: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMulticlasse' | 'dndLivros'>,
  edicao: LivroBaseDnd = lerLivrosDnd(d.dndLivros).base,
  fontes: Set<string> | null = null,
  mostrarFuturos = false,
): HexagonoDnd[] {
  if (edicao === 'phb2014') {
    const raca = s(d.campos.especie), classe = s(d.campos.classe)
    const antecedente = s(d.campos.antecedente), subraca = s(d.campos.subraca2014)
    const racaMeta = RACAS_2014.find(x => x.nome === raca)
    const antMeta = ANTECEDENTES_2014.find(x => x.nome === antecedente)
    const subs = SUBRACAS_2014[raca] ?? []
    const sub = subs.find(x => x.nome === subraca)
    const n = Math.max(1, Math.min(20, Number(d.campos.nivel) || 1))
    return [
      ...(classe ? [{ id: '2014-classe', titulo: classe, descricao: 'Características e progressão da classe na edição 2014: conferir o Livro do Jogador 2014 com o mestre. Sem efeitos 2024.',
        nivel: n, ramo: 'classe' as const, estado: 'referencia' as const, livro: 'Player’s Handbook (2014)' }] : []),
      ...(racaMeta ? [{ id: '2014-raca', titulo: 'Raça: ' + raca, descricao: racaMeta.descricao ?? '',
        nivel: 1, ramo: 'especie' as const, estado: 'referencia' as const, livro: 'Player’s Handbook (2014)' }] : []),
      ...(sub ? [{ id: '2014-subraca', titulo: sub.nome, descricao: sub.detalhe,
        nivel: 1, ramo: 'especie' as const, estado: 'referencia' as const, livro: 'Player’s Handbook (2014)' }] : []),
      ...(antMeta ? [{ id: '2014-antecedente', titulo: 'Antecedente: ' + antecedente, descricao: antMeta.descricao ?? '',
        nivel: 1, ramo: 'antecedente' as const, estado: 'referencia' as const, livro: 'Player’s Handbook (2014)' }] : []),
    ]
  }

  return progressaoVisivel(MARCOS_DND_2024, progressoDaFichaDnd(d))
    .filter(m => (mostrarFuturos || m.estado !== 'futuro') && fonteVisivel(m.fonte, fontes))
    .map(m => {
      const pendente = m.estado === 'escolher' || m.estado === 'pendente'
      const nomeEscolha = m.opcoes?.find(o => o.id === m.escolha)?.nome
      const fonteEscolha = m.opcoes?.find(o => o.id === m.escolha)?.fonte
      const comercial = fonteComercial(m.fonte) || !!fonteEscolha
      const estado: EstadoHexDnd = m.estado === 'futuro' ? 'futuro'
        : pendente ? 'pendente' : comercial ? 'referencia' : 'recebido'
      const ramo = m.origem === 'subclasse' ? 'classe' : m.origem
      return { id: m.id, titulo: m.nome,
        descricao: m.descricao ?? 'Característica da origem ou da classe indicada no livro.',
        nivel: m.nivel, ramo, estado, livro: fonteEscolha ? 'Livro do Jogador (2024) — opção comercial' : m.fonte,
        ...(nomeEscolha ? { escolha: nomeEscolha } : {}) }
    })
}
