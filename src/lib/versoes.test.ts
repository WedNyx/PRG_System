import { describe, expect, it } from 'vitest'
import { VERSOES } from './versoes'
import pacote from '../../package.json'

describe('versões', () => {
  it('a versão do package.json é a primeira das novidades', () => expect(VERSOES[0].versao).toBe(pacote.version))
  it('versões em ordem decrescente e sem repetir', () => {
    const n = VERSOES.map(v => v.versao.split('.').map(Number))
    for (let i = 1; i < n.length; i++) expect(n[i - 1][0] * 1e6 + n[i - 1][1] * 1e3 + n[i - 1][2]).toBeGreaterThan(n[i][0] * 1e6 + n[i][1] * 1e3 + n[i][2])
  })
})
