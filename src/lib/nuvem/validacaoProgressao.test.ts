import { describe, expect, it } from 'vitest'
import { validarCampanha } from './validacao'

const base = {
  nome: 'Teste de campanha',
  descricao: '',
  sistema: 'dnd5e-srd',
  modeloPadrao: 'C',
  permissoes: {},
}
describe('persistência do modo de progressão', () => {
  it('aceita Híbrido para nova campanha', () => {
    const v = validarCampanha({ ...base, configProgressao: { modo: 'hibrido' } })
    expect(v.ok).toBe(true)
    if (v.ok) expect(v.valor.config_progressao?.modo).toBe('hibrido')
  })
  it('rejeita modos desconhecidos', () => {
    const v = validarCampanha({ ...base, configProgressao: { modo: 'invalido' } })
    expect(v.ok).toBe(false)
  })
  it('não altera configuração quando PATCH não traz o campo', () => {
    const v = validarCampanha({ estado: 'ativa' }, true)
    expect(v.ok).toBe(true)
    if (v.ok) expect(v.valor.config_progressao).toBeUndefined()
  })
})
