import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validarSistema } from './autoral'
import { fichaVazia, normalizarFicha, tornarManual } from './calculo'
import { lerArquivo } from '../fichaArquivo'
import { rolarExpressao } from '../dice'
import {
  expressaoValida, fonteDoCusto, formaAtiva, invocacaoAtiva, invocar, lerExtras, lerExtrasDaFicha, novoCombate, passarTurno,
  transformar, turnosInvocacao, usarGolpe, usosGastos, vidaInvocacao, voltarAoNormal, desfazerUso,
} from './extrasFicha'
import type { DadosFicha, Sistema } from './tipos'

const SID = 'autoral-5d1e8a3c7f2b4c6d9e0a3b8f1c2d4e6a'
const def = JSON.parse(readFileSync(join(process.cwd(), 'supabase/sementes/marcas.json'), 'utf8'))
const r = validarSistema(def, { id: SID, autor: 'JOJO' })
const s = (r.ok ? r.sistema : null) as Sistema

describe('Marcas (sistema autoral do JOJO, v0.36.0)', () => {
  it('passa no construtor com as partes extras ligadas', () => {
    expect(r.ok, JSON.stringify(!r.ok && r.erros)).toBe(true)
    expect(s.extras).toEqual(['marcas', 'formas', 'invocacoes', 'efeitos'])
    expect(s.atributos.map(a => a.id)).toEqual(['FOR', 'VEL', 'INT', 'VIG', 'ESS', 'CAR'])
    expect(s.recursos.map(x => x.id)).toEqual(['vida', 'pe', 'sanidade'])
    expect(s.pericias?.livres).toBe(true)
    expect(s.regras?.length).toBe(7)
  })
  it('a migração 036 é a mesma semente, do perfil JOJO, e não sobrescreve edições', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase/migrations/036_sistema_marcas_jojo.sql'), 'utf8')
    const json = sql.match(/'(\{"id":"autoral-.*\})'::jsonb/)![1].replace(/''/g, "'")
    expect(JSON.parse(json)).toEqual(def)
    expect(sql).toContain("a.apelido = 'JOJO'")
    expect(sql).toContain('on conflict (id) do nothing')
    expect(def.id).toBe(SID)
  })
  it('lerExtras só aceita as partes que existem, na ordem certa', () => {
    expect(lerExtras(['efeitos', 'x', 'marcas', 'marcas'])).toEqual(['marcas', 'efeitos'])
    expect(lerExtras('marcas')).toEqual([])
  })
})

describe('Fichas prontas de Marcas (Hawkins, Lucy, Tiamat e Karloy)', () => {
  const pasta = join(process.cwd(), 'presets/fichas/marcas')
  const arquivos = readdirSync(pasta).filter(f => f.endsWith('.json'))
  it('são quatro', () => expect(arquivos.sort()).toEqual(['hawkins.json', 'karloy-o-esquecido.json', 'lucy.json', 'tiamat.json']))
  for (const arq of arquivos) it(arq + ': importa, guarda tudo e todos os dados rolam', () => {
    const a = lerArquivo(readFileSync(join(pasta, arq), 'utf8'))
    expect(a.ok).toBe(true); if (!a.ok) return
    expect(a.sistema).toBe(SID)
    const bruto = a.dados as Partial<DadosFicha>
    const d = tornarManual(s, normalizarFicha(s, bruto))
    expect(d.marcasPoder).toEqual(bruto.marcasPoder)
    expect(d.formas).toEqual(bruto.formas)
    expect(d.invocacoes).toEqual(bruto.invocacoes)
    const golpes = [...(d.marcasPoder ?? []).flatMap(m => m.habilidades), ...(d.formas ?? []).flatMap(f => f.golpes), ...(d.invocacoes ?? []).flatMap(i => i.golpes)]
    for (const g of golpes) if (g.expressao) {
      expect(expressaoValida(g.expressao), g.nome).toBe(true)
      expect(rolarExpressao(g.expressao), g.nome).not.toBeNull()
    }
    for (const p of (d.poderes ?? []) as { expressao?: string; nome: string }[]) if (p.expressao) expect(rolarExpressao(p.expressao), p.nome).not.toBeNull()
    expect(new Set(golpes.map(g => g.id)).size).toBe(golpes.length)
  })
  it('Hawkins: Marca do Lobo 9, lobisomem e lobo primordial; Lucy: três marcas e a Rainha Demônio; Tiamat: Urso Polar 8 e o urso de gelo', () => {
    const ler = (f: string) => { const a = lerArquivo(readFileSync(join(pasta, f), 'utf8')); return a.ok ? normalizarFicha(s, a.dados as Partial<DadosFicha>) : null! }
    const h = ler('hawkins.json'), l = ler('lucy.json'), t = ler('tiamat.json')
    expect(h.marcasPoder?.[0]).toMatchObject({ nome: 'Marca do Lobo', nivel: 9 })
    expect(h.marcasPoder?.[0].habilidades).toHaveLength(10)
    expect(h.formas?.map(f => f.nome)).toEqual(['Lobisomem Uivante', 'Lobo Primordial'])
    expect(l.marcasPoder?.map(m => [m.nome, m.nivel])).toEqual([['Marca do Franco-Atirador', 8], ['Marca da Flor Selvagem', 5], ['Marca da Lontra', 5]])
    expect(l.formas?.[0]).toMatchObject({ nome: 'Rainha Demônio Lucyana', vidaMax: 120, essenciaMax: 72, custo: 7 })
    expect(t.marcasPoder?.[0].habilidades.map(x => x.nivel)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(t.invocacoes?.[0]).toMatchObject({ nome: 'Urso de gelo', vidaMax: 60, custo: 7 })
  })
})

describe('Partes extras: só marca e tira o custo escrito', () => {
  const base = (): DadosFicha => {
    const d = fichaVazia(s)
    return { ...d, recursos: { ...d.recursos, pe: { atual: 10, max: 10 } },
      marcasPoder: [{ id: 'm1', nome: 'Lobo', nivel: 4, habilidades: [{ id: 'g1', nivel: 4, nome: 'Onda', expressao: '1d6', custo: 3, usosMax: 2 }] }],
      formas: [{ id: 'f1', nome: 'Lobisomem', custo: 7, vidaMax: 110, essenciaMax: 30, atributos: { FOR: 4 }, golpes: [{ id: 'g2', nome: 'Chute', expressao: '1d20', custo: 4 }] }],
      invocacoes: [{ id: 'i1', nome: 'Urso', custo: 2, vidaMax: 60, duracao: 2, golpes: [] }],
      efeitos: [{ id: 'e1', nome: 'Congelado', turnos: 1 }, { id: 'e2', nome: 'Molhado' }] }
  }
  it('Usar: marca o uso e tira o custo; sem usos ou sem essência, diz por quê', () => {
    let d = base(); const g = d.marcasPoder![0].habilidades[0]
    d = usarGolpe(s, d, g) as DadosFicha
    expect(d.recursos.pe.atual).toBe(7); expect(usosGastos(d, g)).toBe(1)
    d = usarGolpe(s, d, g) as DadosFicha
    expect(usarGolpe(s, d, g)).toBe('Sem usos neste combate.')
    d = novoCombate(d); expect(usosGastos(d, g)).toBe(0)
    d = { ...d, recursos: { ...d.recursos, pe: { atual: 2, max: 10 } } }
    expect(usarGolpe(s, d, g)).toMatch(/insuficiente/)
    expect(usosGastos(desfazerUso(d, g), g)).toBe(0)
  })
  it('Transformar: paga com a essência normal; na forma, os golpes gastam a essência da forma; voltar guarda a ficha', () => {
    let d: DadosFicha = { ...base(), recursos: { ...base().recursos, pe: { atual: 9, max: 10 } } }
    const f = d.formas![0]
    d = transformar(s, d, f) as DadosFicha
    expect(d.recursos.pe.atual).toBe(2)
    expect(formaAtiva(d)?.id).toBe('f1')
    expect(fonteDoCusto(s, d)).toMatchObject({ tipo: 'forma', atual: 30 })
    d = usarGolpe(s, d, f.golpes[0]) as DadosFicha
    expect(fonteDoCusto(s, d)?.atual).toBe(26); expect(d.recursos.pe.atual).toBe(2)
    d = voltarAoNormal(d); expect(formaAtiva(d)).toBeNull()
    expect(d.marcas?.fe_f1).toBe(26)
    expect(typeof transformar(s, d, f)).toBe('string')
  })
  it('Invocar e passar turno: duração desce e a invocação vai embora; efeitos contam até 0', () => {
    let d = invocar(s, base(), base().invocacoes![0]) as DadosFicha
    const i = d.invocacoes![0]
    expect(d.recursos.pe.atual).toBe(8); expect(invocacaoAtiva(d, i)).toBe(true); expect(vidaInvocacao(d, i)).toBe(60); expect(turnosInvocacao(d, i)).toBe(2)
    d = passarTurno(d)
    expect(turnosInvocacao(d, i)).toBe(1); expect(d.efeitos?.map(e => e.turnos)).toEqual([0, undefined])
    d = passarTurno(d); expect(invocacaoAtiva(d, i)).toBe(false)
  })
  it('lerExtrasDaFicha limpa o que vem de fora', () => {
    const x = lerExtrasDaFicha({ marcasPoder: [{ nome: '' }, { nome: 'Ok', nivel: '3', habilidades: [{ nome: 'A', nivel: 5, custo: -4, usosMax: 'x' }, 'lixo'] }] as never,
      formas: 'nada' as never, efeitos: [{ nome: 'E', turnos: 9999 }] as never })
    expect(x.marcasPoder).toHaveLength(1)
    expect(x.marcasPoder![0]).toMatchObject({ nome: 'Ok', nivel: 3 })
    expect(x.marcasPoder![0].habilidades).toEqual([{ id: expect.any(String), nome: 'A', nivel: 5 }])
    expect(x.formas).toEqual([]); expect(x.efeitos![0].turnos).toBe(999); expect(x.invocacoes).toBeUndefined()
  })
  it('categorias: o que o personagem tem segue Habilidades; efeitos seguem PV', async () => {
    const { categoria } = await import('../nuvem/categorias')
    for (const k of ['marcasPoder', 'formas', 'invocacoes']) expect(categoria(SID, k)).toBe('habilidades')
    expect(categoria(SID, 'efeitos')).toBe('pv')
  })
})
