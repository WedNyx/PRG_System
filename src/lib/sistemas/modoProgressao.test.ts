import { describe, expect, it } from 'vitest'
import { configuracaoProgressaoPadrao, lerConfiguracaoProgressao, modoDaFicha, permissoesDoModo } from './modoProgressao'

describe('modo de progressão por campanha', () => {
  it('usa automático como padrão seguro', () => {
    expect(configuracaoProgressaoPadrao().modo).toBe('automatico')
    expect(lerConfiguracaoProgressao({ modo: 'desconhecido' }).modo).toBe('automatico')
  })
  it('permite escolha manual ou híbrida', () => {
    expect(permissoesDoModo('manual').aplicarCaracteristicasAutomaticas).toBe(false)
    expect(permissoesDoModo('manual').permitirArvorePersonalizada).toBe(true)
    expect(permissoesDoModo('hibrido').mostrarProgressaoOficial).toBe(true)
    expect(permissoesDoModo('automatico').permitirArvorePersonalizada).toBe(false)
  })
  it('permite exceção por ficha sem mudar o padrão', () => {
    const config = lerConfiguracaoProgressao({ modo: 'automatico', excecoesPorFicha: { heroi: 'hibrido', outro: 'invalido' } })
    expect(modoDaFicha(config, 'heroi')).toBe('hibrido')
    expect(modoDaFicha(config, 'outro')).toBe('automatico')
  })
})
