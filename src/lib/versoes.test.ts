import { describe, expect, it } from 'vitest'
import { VERSOES, proximaVersao, versaoValida } from './versoes'
import pacote from '../../package.json'

describe('versões', () => {
  it('a versão do package.json é a primeira das novidades', () => expect(VERSOES[0].versao).toBe(pacote.version))
  it('versões em ordem decrescente e sem repetir', () => {
    const n = VERSOES.map(v => v.versao.split('.').map(Number))
    for (let i = 1; i < n.length; i++) expect(n[i - 1][0] * 1e6 + n[i - 1][1] * 1e3 + n[i - 1][2]).toBeGreaterThan(n[i][0] * 1e6 + n[i][1] * 1e3 + n[i][2])
  })
})

describe('Numeração da plataforma 0..10 / 0..99', () => {
  it('sobe a revisão até 10', () => {
    expect(proximaVersao('0.33.8')).toBe('0.33.9')
    expect(proximaVersao('0.33.9')).toBe('0.33.10')
  })
  it('ao atingir 11, zera revisão e incrementa a menor', () => {
    expect(proximaVersao('0.0.10')).toBe('0.1.0')
    expect(proximaVersao('0.33.10')).toBe('0.34.0')
    expect(proximaVersao('0.98.10')).toBe('0.99.0')
  })
  it('depois de 0.99.10, sobe a maior', () => {
    expect(proximaVersao('0.99.10')).toBe('1.0.0')
    expect(proximaVersao('1.99.10')).toBe('2.0.0')
  })
  it('rejeita versões fora de faixa ou formato inconsistente', () => {
    for (const v of ['1.100.0','1.2.11','1.2','-1.2.0','1.02.0','abc']) {
      expect(versaoValida(v)).toBe(false)
      expect(() => proximaVersao(v)).toThrow()
    }
    expect(versaoValida('0.33.9')).toBe(true)
  })
  it('todo o histórico usa limites permitidos e o pacote corresponde ao topo', () => {
    for (const v of VERSOES) expect(versaoValida(v.versao)).toBe(true)
    expect(VERSOES[0].versao).toBe(pacote.version)
  })
})
