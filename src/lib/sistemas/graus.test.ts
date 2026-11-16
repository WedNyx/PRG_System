import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validarSistema } from './autoral'
import { dadoDoGrau, expressaoGraus, grauValido, lerGraus, lerPericiasExtras, lerTabelas, linhaDaTabela, opcoesDeGrau, rotuloGrau } from './graus'
import { normalizarFicha, fichaVazia } from './calculo'

const g = lerGraus({ lados: [12, 4, 6, 8, 10, 999], zero: 4, maxPericia: 10 })

describe('graus de dado (v0.35.6)', () => {
  it('lê os graus e as opções', () => {
    expect(g).toEqual({ lados: [4, 6, 8, 10, 12], zero: 4, maxPericia: 10 })
    expect(opcoesDeGrau(g)).toEqual([0, 4, 6, 8, 10, 12])
    expect(opcoesDeGrau(g, 10)).toEqual([0, 4, 6, 8, 10])
    expect(grauValido(7, g)).toBe(6); expect(grauValido(20, g)).toBe(12)
    expect(lerGraus(null).lados).toEqual([4, 6, 8, 10, 12])
  })
  it('monta o teste: dado do atributo + dado da vivência + bônus; 0 rola o dado do zero', () => {
    expect(expressaoGraus(6, 4, 0, g)).toBe('1d6+1d4')
    expect(expressaoGraus(0, null, 2, g)).toBe('1d4+2')
    expect(expressaoGraus(8, null, -1, g)).toBe('1d8-1')
    expect(dadoDoGrau(0, { lados: [6] })).toBeNull()
    expect(rotuloGrau(0, g)).toBe('0 (d4)'); expect(rotuloGrau(10, g)).toBe('d10')
  })
  it('tabelas roláveis', () => {
    const [t] = lerTabelas([{ nome: 'Efeito', dado: '1d10', campo: 'efeito', linhas: [{ de: 2, ate: 5, texto: 'Meio' }, { de: 1, texto: 'Um' }, { de: 6, ate: 10, texto: 'Alto' }] }], new Set(['efeito']))
    expect(t.id).toBe('efeito'); expect(t.campo).toBe('efeito')
    expect(linhaDaTabela(t, 1)?.texto).toBe('Um'); expect(linhaDaTabela(t, 7)?.texto).toBe('Alto')
    expect(lerTabelas([{ nome: 'X', dado: 'rm -rf', linhas: [{ de: 1, texto: 'a' }] }], new Set())).toEqual([])
  })
  it('perícias do jogador', () => {
    expect(lerPericiasExtras([{ id: 'x_abc123', nome: ' Medicina ' }, { id: 'ruim', nome: 'X' }, { id: 'x_abc123', nome: 'Dup' }])).toEqual([{ id: 'x_abc123', nome: 'Medicina' }])
  })
})

describe('Projeto N.O.V.A (sistema autoral do godgamer)', () => {
  const nova = JSON.parse(readFileSync(join(process.cwd(), 'supabase/sementes/nova.json'), 'utf8'))
  const r = validarSistema(nova, { id: 'autoral-' + 'a'.repeat(32), autor: 'godgamer' })
  it('passa na validação do construtor sem perder nada', () => {
    expect(r.ok, JSON.stringify(!r.ok && r.erros)).toBe(true)
    if (!r.ok) return
    const s = r.sistema
    expect(s.rolagem).toBe('graus')
    expect(s.atributos.map(a => [a.id, a.padrao])).toEqual([['FIS', 6], ['PSI', 6], ['ALM', 6], ['CLA', 0]])
    expect(s.pericias?.livres).toBe(true); expect(s.pericias?.titulo).toBe('Vivências')
    expect(s.recursos.map(x => x.id)).toEqual(['vida', 'horror', 'clareza'])
    expect(s.tabelas?.[0].linhas).toHaveLength(10); expect(s.tabelas?.[0].campo).toBe('efeito_especial')
    expect(s.regras?.length).toBe(7)
    expect(s.atributos.every(a => !!a.dica)).toBe(true)
  })
  it('a ficha guarda as vivências que o jogador cria', () => {
    if (!r.ok) return
    const d = normalizarFicha(r.sistema, { ...fichaVazia(r.sistema), periciasExtras: [{ id: 'x_k2j4h5', nome: 'Investigação' }], pericias: { x_k2j4h5: 4 } })
    expect(d.periciasExtras).toEqual([{ id: 'x_k2j4h5', nome: 'Investigação' }]); expect(d.pericias.x_k2j4h5).toBe(4)
  })
})

describe('combate na mesa com graus de dado', async () => {
  const { resumoCombate, regraDeAtaque } = await import('./combate')
  const nova = JSON.parse(readFileSync(join(process.cwd(), 'supabase/sementes/nova.json'), 'utf8'))
  const r = validarSistema(nova, { id: 'autoral-' + 'b'.repeat(32) })
  it('o teste de ataque soma o dado do atributo com o da vivência', () => {
    if (!r.ok) throw new Error('inválido')
    const d = { ...fichaVazia(r.sistema), atributos: { FIS: 8, PSI: 6, ALM: 6, CLA: 0 }, periciasExtras: [{ id: 'x_luta01', nome: 'Luta de rua' }], pericias: { fortitude: 4, x_luta01: 6 } }
    const c = resumoCombate(r.sistema, d)
    const t = c.testes.find(x => x.id === c.testePadrao)!
    expect(t.nome).toBe('Físico + Luta de rua')
    expect(regraDeAtaque(r.sistema, 1, t.dados, t.assim, t.graus).expressao).toBe('1d8+1d6+1')
  })
})
