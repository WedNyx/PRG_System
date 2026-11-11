import { describe, expect, it } from 'vitest'
import { conferirHash, gerarHash, hashToken, nomeAparelho, novoToken, validarSenhaNova } from './senha'

describe('senha do perfil', () => {
  it('guarda só o hash e confere certo', async () => {
    const h = await gerarHash('lua-roxa-7')
    expect(h).toMatch(/^scrypt\$16384\$8\$1\$/)
    expect(h).not.toContain('lua-roxa-7')
    expect(await conferirHash('lua-roxa-7', h)).toBe(true)
    expect(await conferirHash('lua-roxa-8', h)).toBe(false)
    expect(await gerarHash('lua-roxa-7')).not.toBe(h)
  })
  it('recusa entradas estranhas', async () => {
    const h = await gerarHash('abcdef')
    expect(await conferirHash('', h)).toBe(false)
    expect(await conferirHash(123, h)).toBe(false)
    expect(await conferirHash('abcdef', null)).toBe(false)
    expect(await conferirHash('abcdef', 'md5$x')).toBe(false)
  })
  it('valida a senha nova', () => {
    expect(validarSenhaNova('12345').ok).toBe(false)
    expect(validarSenhaNova('      ').ok).toBe(false)
    expect(validarSenhaNova('x'.repeat(73)).ok).toBe(false)
    expect(validarSenhaNova('dragão!').ok).toBe(true)
  })
  it('tokens aleatórios e nome do aparelho sem dados pessoais', () => {
    const t = novoToken()
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(novoToken()).not.toBe(t)
    expect(hashToken(t)).not.toBe(t)
    expect(nomeAparelho('Mozilla/5.0 (Linux; Android 14; Pixel 7) Mobile')).toBe('Celular Android')
    expect(nomeAparelho('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Computador Windows')
    expect(nomeAparelho(null)).toBe('Aparelho')
  })
})
