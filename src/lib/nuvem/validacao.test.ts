import { describe, expect, it } from 'vitest'
import {
  CODIGO_REGEX, gerarCodigoConvite, normalizarCodigo, normalizarExcecoes, normalizarPermissoes,
  podeAdministrar, situacaoConvite, validarCampanha, validarConvite, validarFichaDados,
} from './validacao'

describe('validarCampanha', () => {
  const base = { nome: 'Ecos da Lua', descricao: '', sistema: 'Lunethernnyis — Opositores', modeloPadrao: 'C' }
  it('aceita campanha válida e preenche permissões do modelo', () => {
    const r = validarCampanha(base)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.valor.permissoes?.atributos).toBe('aprovacao')
  })
  it('recusa nome curto, modelo e estado inválidos', () => {
    expect(validarCampanha({ ...base, nome: 'ab' }).ok).toBe(false)
    expect(validarCampanha({ ...base, modeloPadrao: 'Z' }).ok).toBe(false)
    expect(validarCampanha({ ...base, estado: 'apagada' }).ok).toBe(false)
  })
  it('modo parcial altera só o que veio', () => {
    const r = validarCampanha({ estado: 'pausada' }, true)
    expect(r).toEqual({ ok: true, valor: { estado: 'pausada' } })
  })
  it('ignora campos desconhecidos (não deixa trocar mestre_id)', () => {
    const r = validarCampanha({ ...base, mestre_id: 'x', id: 'y' })
    expect(r.ok && 'mestre_id' in r.valor).toBe(false)
  })
})

describe('permissões', () => {
  it('descarta regras inválidas e campos estranhos', () => {
    const p = normalizarPermissoes({ pv: 'mestre', atributos: 'hack', extra: 'livre' }, 'A')
    expect(p.pv).toBe('mestre')
    expect(p.atributos).toBe('livre')
    expect('extra' in p).toBe(false)
  })
  it('exceções guardam apenas campos válidos', () => {
    expect(normalizarExcecoes({ nivel: 'mestre', x: 'livre', pv: 'nada' })).toEqual({ nivel: 'mestre' })
    expect(normalizarExcecoes([1])).toEqual({})
  })
  it('apenas mestre e co-mestre administram', () => {
    expect(podeAdministrar('mestre')).toBe(true)
    expect(podeAdministrar('comestre')).toBe(true)
    expect(podeAdministrar('jogador')).toBe(false)
    expect(podeAdministrar(null)).toBe(false)
  })
})

describe('convites', () => {
  it('gera códigos de 8 caracteres sem ambiguidade', () => {
    for (let i = 0; i < 200; i++) expect(gerarCodigoConvite()).toMatch(CODIGO_REGEX)
    expect(gerarCodigoConvite(() => new Uint8Array(8))).toBe('AAAAAAAA')
  })
  it('normaliza o que a pessoa digita', () => {
    expect(normalizarCodigo(' abcd-efgh ')).toBe('ABCDEFGH')
    expect(normalizarCodigo('ABCD0FGH')).toBeNull() // 0 não existe no alfabeto
    expect(normalizarCodigo(123)).toBeNull()
  })
  it('valida validade e usos', () => {
    expect(validarConvite({}).ok).toBe(true)
    expect(validarConvite({ dias: 0 }).ok).toBe(false)
    expect(validarConvite({ maxUsos: 101 }).ok).toBe(false)
  })
  it('calcula a situação', () => {
    const agora = Date.parse('2026-11-08T12:00:00Z')
    const c = { codigo: 'ABCDEFGH', expira_em: '2026-11-10T00:00:00Z', usos: 0, max_usos: 5, revogado: false }
    expect(situacaoConvite(c, agora)).toBe('valido')
    expect(situacaoConvite({ ...c, revogado: true }, agora)).toBe('revogado')
    expect(situacaoConvite({ ...c, expira_em: '2026-11-01T00:00:00Z' }, agora)).toBe('expirado')
    expect(situacaoConvite({ ...c, usos: 5 }, agora)).toBe('esgotado')
  })
})

describe('validarFichaDados', () => {
  it('extrai o nome do personagem da Ficha V8', () => {
    const r = validarFichaDados({ version: 2, fields: { name: '  Lyra  ' } })
    expect(r.ok && r.valor.nome).toBe('Lyra')
  })
  it('recusa formatos errados e fichas enormes', () => {
    expect(validarFichaDados([]).ok).toBe(false)
    expect(validarFichaDados(null).ok).toBe(false)
    expect(validarFichaDados({ portrait: 'x'.repeat(600_000) }).ok).toBe(false)
  })
})
