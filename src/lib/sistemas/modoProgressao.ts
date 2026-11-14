/** Controle de progressão da ficha por campanha; não altera a árvore legada. */
import { baseDndValida, type LivroBaseDnd } from './dndLivros'
export type ModoProgressao = 'automatico' | 'manual' | 'hibrido'
export type ConfiguracaoProgressao = {
  modo: ModoProgressao
  /** Permite ao mestre autorizar uma exceção para uma ficha específica. */
  excecoesPorFicha?: Record<string, ModoProgressao>
  /** Edição-base escolhida pelo mestre para a criação de personagens D&D. */
  baseLivro?: LivroBaseDnd
  /** Fontes liberadas pelo mestre (ids de FONTES_DND; o SRD está sempre liberado). Sem o campo: só o SRD. v0.33.6 */
  fontes?: string[]
  /** Outros livros/suplementos que o mestre anotou (só o nome, sem conteúdo). */
  fontesExtras?: string[]
}
/** Ids de fonte aceitos (o catálogo fica em dnd2024Fontes.ts; aqui só o formato, para não pesar no servidor). */
const ID_FONTE = /^[a-z0-9-]{2,30}$/
export const configuracaoProgressaoPadrao = (): ConfiguracaoProgressao => ({ modo: 'hibrido' })

export function lerConfiguracaoProgressao(valor: unknown): ConfiguracaoProgressao {
  if (!valor || typeof valor !== 'object') return configuracaoProgressaoPadrao()
  const objeto = valor as Record<string, unknown>
  const modo = modoValido(objeto.modo) ? objeto.modo : 'hibrido'
  const excecoesPorFicha: Record<string, ModoProgressao> = {}
  if (objeto.excecoesPorFicha && typeof objeto.excecoesPorFicha === 'object') {
    for (const [id, escolha] of Object.entries(objeto.excecoesPorFicha)) {
      if (/^[a-zA-Z0-9_-]{1,100}$/.test(id) && modoValido(escolha)) excecoesPorFicha[id] = escolha
    }
  }
  const fontes = Array.isArray(objeto.fontes) ? [...new Set(objeto.fontes.filter((f): f is string => typeof f === 'string' && ID_FONTE.test(f)))].slice(0, 20) : undefined
  const fontesExtras = Array.isArray(objeto.fontesExtras)
    ? [...new Set(objeto.fontesExtras.filter((f): f is string => typeof f === 'string').map(f => f.trim().slice(0, 60)).filter(Boolean))].slice(0, 10) : undefined
  const baseLivro = baseDndValida(objeto.baseLivro) ? objeto.baseLivro : undefined
  return { modo, excecoesPorFicha, ...(baseLivro ? { baseLivro } : {}), ...(fontes ? { fontes } : {}), ...(fontesExtras ? { fontesExtras } : {}) }
}
function modoValido(valor: unknown): valor is ModoProgressao {
  return valor === 'automatico' || valor === 'manual' || valor === 'hibrido'
}
export function modoDaFicha(config: ConfiguracaoProgressao, fichaId: string): ModoProgressao {
  return config.excecoesPorFicha?.[fichaId] ?? config.modo
}
export function permissoesDoModo(modo: ModoProgressao) {
  return {
    mostrarProgressaoOficial: modo !== 'manual',
    aplicarCaracteristicasAutomaticas: modo !== 'manual',
    permitirArvorePersonalizada: modo !== 'automatico',
    permitirExcecoes: modo === 'hibrido',
  }
}
