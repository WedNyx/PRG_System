import { describe, expect, it } from 'vitest'
import { senhaConfere } from './admin'

describe('senha do administrador', () => {
  it('confere só a senha exata', () => {
    expect(senhaConfere('lua-roxa-42', 'lua-roxa-42')).toBe(true)
    expect(senhaConfere('lua-roxa-4', 'lua-roxa-42')).toBe(false)
    expect(senhaConfere('LUA-ROXA-42', 'lua-roxa-42')).toBe(false)
  })
  it('sem senha configurada ou vazia, nunca libera', () => {
    expect(senhaConfere('', '')).toBe(false)
    expect(senhaConfere('qualquer', undefined)).toBe(false)
    expect(senhaConfere(undefined, 'x')).toBe(false)
  })
})
