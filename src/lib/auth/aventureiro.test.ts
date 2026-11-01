import { describe, expect, it } from 'vitest'
import { validarApelidoAventureiro } from './aventureiro'

describe('validarApelidoAventureiro', () => {
  it('normaliza espaços', () => {
    expect(validarApelidoAventureiro('  Wed   Nyx  ')).toEqual({ ok: true, apelido: 'Wed Nyx' })
  })
  it('recusa apelido curto', () => {
    expect(validarApelidoAventureiro('ab').ok).toBe(false)
  })
  it('recusa apelido longo', () => {
    expect(validarApelidoAventureiro('a'.repeat(41)).ok).toBe(false)
  })
  it('recusa caracteres de controle', () => {
    expect(validarApelidoAventureiro('Wed\u0000Nyx').ok).toBe(false)
  })
  it('recusa valores que não são texto', () => {
    expect(validarApelidoAventureiro(null).ok).toBe(false)
  })
})
