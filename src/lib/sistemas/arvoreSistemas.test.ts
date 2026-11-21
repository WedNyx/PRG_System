import { describe, expect, it } from 'vitest'
import { SISTEMAS } from './catalogo'
import { fichaVazia } from './calculo'
import { arvoreDoSistema, chaveEscolha } from './arvoreSistemas'
import type { DadosFicha, Sistema } from './tipos'

const sis = (id: string) => SISTEMAS.find(s => s.id === id)!
const com = (s: Sistema, campos: Record<string, string | number>, extra: Partial<DadosFicha> = {}): DadosFicha => ({ ...fichaVazia(s), ...extra, campos: { ...fichaVazia(s).campos, ...campos } })

describe('Árvore de cada sistema (v0.36.2)', () => {
  it('Ordem: o NEX diz o que já tem e qual é o próximo marco', () => {
    const s = sis('ordem-paranormal'), a = arvoreDoSistema(s, com(s, { nex: '35%', classe: 'Combatente' }))!
    expect(a.medida).toMatchObject({ nome: 'NEX', atual: 35, max: 99 })
    const classe = a.ramos.find(r => r.id === 'classe')!
    expect(classe.marcos.filter(m => m.estado === 'recebido').map(m => m.quando)).toEqual([5, 15, 30, 35])
    expect(a.ramos.flatMap(r => r.marcos).filter(m => m.estado === 'proximo').map(m => m.titulo)).toEqual(['Habilidade de trilha'])
    expect(a.ramos.find(r => r.id === 'trilha')!.marcos.map(m => m.quando)).toEqual([10, 40, 65, 99])
  })
  it('Pathfinder 2e: talentos e impulsos nos níveis certos', () => {
    const s = sis('pf2e'), a = arvoreDoSistema(s, com(s, { nivel: 5 }))!
    const q = (ramo: string, titulo: string) => a.ramos.find(r => r.id === ramo)!.marcos.filter(m => m.titulo === titulo).map(m => m.quando)
    expect(q('ancestralidade', 'Talento de ancestralidade')).toEqual([1, 5, 9, 13, 17])
    expect(q('gerais', 'Talento geral')).toEqual([3, 7, 11, 15, 19])
    expect(q('gerais', 'Impulsos de atributo')).toEqual([5, 10, 15, 20])
    expect(q('pericias', 'Aumento de perícia')).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19])
  })
  it('Tormenta20, Faroeste e Opositores seguem o nível; Fate, Blades, CoC e Mörk Borg são guia', () => {
    for (const id of ['tormenta20', 'faroeste-arcano']) expect(arvoreDoSistema(sis(id), com(sis(id), { nivel: 3, nivel_pistoleiro: 3 }))!.medida?.atual, id).toBe(3)
    for (const id of ['fate-core', 'blades', 'call-of-cthulhu', 'brp', 'mork-borg']) {
      const a = arvoreDoSistema(sis(id), fichaVazia(sis(id)))!
      expect(a.medida, id).toBeUndefined()
      expect(a.ramos.every(r => r.marcos.every(m => m.estado === 'referencia')), id).toBe(true)
    }
  })
  it('Marcas: cada marca vira um ramo, e o nível dela libera as habilidades', () => {
    const s = { ...sis('livre'), id: 'autoral-x', nome: 'Marcas', extras: ['marcas' as const] }
    const a = arvoreDoSistema(s, { ...fichaVazia(s), marcasPoder: [{ id: 'm1', nome: 'Lobo', nivel: 2, habilidades: [{ id: 'a', nivel: 1, nome: 'A' }, { id: 'b', nivel: 2, nome: 'B' }, { id: 'c', nivel: 3, nome: 'C' }, { id: 'd', nivel: 4, nome: 'D' }] }] })!
    expect(a.ramos[0].marcos.map(m => m.estado)).toEqual(['recebido', 'recebido', 'proximo', 'futuro'])
  })
  it('sistema sem árvore própria fica só com a do mestre; a escolha anotada usa uma chave curta', () => {
    expect(arvoreDoSistema(sis('livre'), fichaVazia(sis('livre')))).toBeNull()
    expect(chaveEscolha('op-pc15')).toBe('arv_op-pc15')
    expect(chaveEscolha('x'.repeat(80)).length).toBe(40)
  })
})
