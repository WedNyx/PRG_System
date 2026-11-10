import { describe, expect, it } from 'vitest'
import { NOME_OK, TABELAS_BACKUP, nomeDaCopia, resumo } from './backup'
import { localDaRota } from './servidor'

describe('cópias de segurança', () => {
  it('nome do arquivo por dia e validação', () => {
    expect(nomeDaCopia(new Date('2026-11-09T06:17:00Z'))).toBe('prg-backup-2026-11-09.json')
    expect(nomeDaCopia(new Date('2026-11-10T01:30:00Z'))).toBe('prg-backup-2026-11-09.json') // 22:30 em Brasília
    expect(NOME_OK.test('prg-backup-2026-11-09.json')).toBe(true)
    expect(NOME_OK.test('../segredo.json')).toBe(false)
    expect(NOME_OK.test('prg-backup-2026-11-09.json/../x')).toBe(false)
  })
  it('cobre as tabelas da plataforma, sem repetir e sem o registro de erros', () => {
    expect(new Set(TABELAS_BACKUP).size).toBe(TABELAS_BACKUP.length)
    expect(TABELAS_BACKUP).toContain('prg_fichas')
    expect(TABELAS_BACKUP).toContain('prg_sistemas_autorais')
    expect(TABELAS_BACKUP as readonly string[]).not.toContain('prg_erros')
    expect(TABELAS_BACKUP[0]).toBe('prg_public_adventurers')
  })
  it('resumo conta as linhas', () => {
    expect(resumo({ versao: 1, plataforma: 'x', criado_em: '', tabelas: { a: [1, 2], b: [] } })).toEqual({ a: 2, b: 0 })
  })
})

describe('registro de erros', () => {
  it('tira ids do caminho', () => {
    expect(localDaRota('/api/prg/campanhas/3f2b1c4d-1111-4222-8333-444455556666/fichas')).toBe('/api/prg/campanhas/:id/fichas')
  })
})
