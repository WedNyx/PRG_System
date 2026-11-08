import { describe, expect, it } from 'vitest'
import { aplicar, categoria, diferencas, resumoValor, separarPorRegra } from './categorias'
import { permissoesPadrao } from '../campanhas/permissoes'

describe('categorias da Ficha V8', () => {
  it('classifica campos', () => {
    expect(categoria('lunethernnyis-v8', 'fields.name')).toBe('identidade')
    expect(categoria('lunethernnyis-v8', 'fields.statPOT')).toBe('atributos')
    expect(categoria('lunethernnyis-v8', 'fields.skill0_1')).toBe('pericias')
    expect(categoria('lunethernnyis-v8', 'fields.hpCurrent')).toBe('pv')
    expect(categoria('lunethernnyis-v8', 'powers')).toBe('habilidades')
    expect(categoria('lunethernnyis-v8', 'weapons')).toBe('equipamentos')
    expect(categoria('lunethernnyis-v8', 'fields.xp')).toBe('nivel')
  })
  it('separa mudanças pelas regras do modelo C', () => {
    const antes = { version: 2, fields: { name: 'A', statPOT: '1', hpCurrent: '30', notes: '' }, powers: [] }
    const depois = { version: 2, fields: { name: 'B', statPOT: '3', hpCurrent: '20', notes: 'oi' }, powers: [{ n: 'x' }] }
    const m = diferencas('lunethernnyis-v8', antes, depois)
    expect(m.map(x => x.categoria).sort()).toEqual(['anotacoes', 'atributos', 'habilidades', 'identidade', 'pv'])
    const s = separarPorRegra(m, permissoesPadrao('C'), {})
    expect(s.livres.map(x => x.categoria).sort()).toEqual(['anotacoes', 'identidade', 'pv'])
    expect(s.aprovacao.map(x => x.categoria).sort()).toEqual(['atributos', 'habilidades'])
    // aplicar só as livres mantém os atributos antigos
    const salvo = aplicar(antes, s.livres) as { fields: Record<string, string>; powers: unknown[] }
    expect(salvo.fields.name).toBe('B'); expect(salvo.fields.statPOT).toBe('1'); expect(salvo.powers).toEqual([])
  })
  it('exceção do jogador e área bloqueada', () => {
    const m = diferencas('lunethernnyis-v8', { fields: { hpCurrent: '1', statPOT: '1' } }, { fields: { hpCurrent: '2', statPOT: '2' } })
    const s = separarPorRegra(m, permissoesPadrao('C'), { atributos: 'livre' }, ['pv'])
    expect(s.livres.map(x => x.categoria)).toEqual(['atributos'])
    expect(s.bloqueadas.map(x => x.categoria)).toEqual(['pv'])
  })
})

describe('categorias de ficha genérica', () => {
  it('classifica e aplica', () => {
    expect(categoria('dnd5e-srd', 'campos.nivel')).toBe('nivel')
    expect(categoria('dnd5e-srd', 'campos.classe')).toBe('identidade')
    expect(categoria('dnd5e-srd', 'listas.inventario')).toBe('equipamentos')
    expect(categoria('dnd5e-srd', 'listas.ataques')).toBe('equipamentos')
    expect(categoria('faroeste-arcano', 'listas.talentos')).toBe('habilidades')
    expect(categoria('faroeste-arcano', 'campos.nivel_pistoleiro')).toBe('nivel')
    const a = { sistema: 'x', nome: 'A', campos: { nivel: 1 }, atributos: { FOR: 10 }, listas: { anotacoes: '' } }
    const b = { ...a, campos: { nivel: 2 }, atributos: { FOR: 12 } }
    const m = diferencas('dnd5e-srd', a, b)
    expect(m.map(x => x.caminho).sort()).toEqual(['atributos', 'campos.nivel'])
    expect(aplicar(a, m)).toEqual(b)
  })
  it('resumo não despeja imagens', () => {
    expect(resumoValor('data:image/jpeg;base64,AAAA')).toBe('[imagem]')
    expect(resumoValor({ FOR: 10, DES: 12 })).toBe('FOR: 10, DES: 12')
    expect(resumoValor([1, 2])).toBe('2 item(ns)')
  })
})

describe('ficha V8 nova', () => {
  it('primeiro salvamento com valores iniciais não gera pedidos', () => {
    const antes = { version: 2, fields: {} }
    const depois = { version: 2, fields: { name: '', statPOT: '1', skill0_0: '0', level: '1', xp: '0', hpCurrent: '30', hpMax: '30', dodges: '2', guards: '1', reaction: '1', defMod: '0', notes: '' }, powers: [], weapons: [], inventoryItems: [], portrait: null }
    expect(diferencas('lunethernnyis-v8', antes, depois)).toEqual([])
  })
  it('mas muda se o valor for diferente do inicial', () => {
    const m = diferencas('lunethernnyis-v8', { fields: {} }, { fields: { statPOT: '3' } })
    expect(m.map(x => x.categoria)).toEqual(['atributos'])
  })
})

import { resumoMudanca } from './categorias'
describe('resumo de mudança', () => {
  it('mostra só o que mudou', () => {
    expect(resumoMudanca({ FOR: 10, DES: 10 }, { FOR: 10, DES: 16 })).toEqual(['DES: 10', 'DES: 16'])
    expect(resumoMudanca('a', 'b')).toEqual(['a', 'b'])
  })
})
