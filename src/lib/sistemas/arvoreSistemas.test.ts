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

describe('Árvore do autor, vivências em d4 e aparência (v0.36.3)', () => {
  const nova = async () => {
    const { readFileSync } = await import('node:fs')
    const { validarSistema } = await import('./autoral')
    const def = JSON.parse(readFileSync('supabase/sementes/nova.json', 'utf8'))
    def.campos.push({ id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 })
    def.graus.inicialPericia = 4
    def.visual = { acento: '#FF0000', fonte: 'classica', arvore: 'opositores', lixo: 1 }
    def.arvore = { pontos: 1, nos: [
      { id: 'raiz', nome: 'Peculiaridade', custo: 1, cor: '#e2e8f0', x: 0, y: 0, requer: [], efeitos: [] },
      { id: 'aco', nome: 'Mente de aço', custo: 1, cor: '#a78bfa', x: 100, y: -100, requer: ['raiz'], efeitos: [{ tipo: 'poder', poder: { nome: 'Mente de aço', tipo: 'habilidade', custo: 1, recurso: 'clareza' } }] },
      { id: 'res', nome: 'Resistência', custo: 1, cor: '#a78bfa', x: -100, y: -100, requer: ['raiz'], efeitos: [] }] }
    const r = validarSistema(def, { id: 'autoral-' + 'd'.repeat(32), autor: 'godgamer' })
    if (!r.ok) throw new Error(JSON.stringify(r.erros))
    return r.sistema
  }
  it('vivências começam em d4 e a aparência do autor é lida e limpa', async () => {
    const s = await nova()
    expect(s.graus?.inicialPericia).toBe(4)
    expect(Object.values(fichaVazia(s).pericias).every(v => v === 4)).toBe(true)
    expect(s.visual).toEqual({ acento: '#ff0000', fonte: 'classica', arvore: 'opositores' })
  })
  it('a árvore do autor entra na ficha antiga, com camadas, pontos e liberar', async () => {
    const s = await nova()
    const { liberarNo } = await import('./arvore')
    const d: DadosFicha = { ...fichaVazia(s), arvore: undefined }
    const a = arvoreDoSistema(s, d)!
    expect(a.ramos[0].id).toBe('autor')
    expect(a.ramos[0].marcos.map(m => [m.titulo, m.quando, m.estado])).toEqual([['Peculiaridade', 1, 'proximo'], ['Resistência', 2, 'futuro'], ['Mente de aço', 2, 'futuro']])
    expect(a.autor?.livres).toBe(1)
    const lib = liberarNo(a.autor!.arvore, 'raiz', a.autor!.extra, a.autor!.nivel, d)
    const depois = arvoreDoSistema(s, { ...d, arvore: lib.arvore })!
    expect(depois.ramos[0].marcos[0].estado).toBe('recebido')
    expect(depois.ramos[0].marcos[1].no?.motivo).toMatch(/Faltam 1 ponto/)
  })
})
