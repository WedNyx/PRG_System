/** Controle de progressão da ficha por campanha; não altera a árvore legada. */
export type ModoProgressao = 'automatico' | 'manual' | 'hibrido'
export type ConfiguracaoProgressao = {
  modo: ModoProgressao
  /** Permite ao mestre autorizar uma exceção para uma ficha específica. */
  excecoesPorFicha?: Record<string, ModoProgressao>
}
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
  return { modo, excecoesPorFicha }
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
