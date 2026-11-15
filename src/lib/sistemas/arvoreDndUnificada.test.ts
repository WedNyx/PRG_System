import { describe, expect, it } from 'vitest'
import { fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'
import { hexagonosOficiaisDnd } from './arvoreDndOficial'
import { bonusDaArvore, lerArvore, poderesDaArvore } from './arvore'
import { ordenarNosVerticais } from './arvoreVisual'

const s = sistemaPorId('dnd5e-srd')!
const extras = {
  pontos: 2,
  nos: [
    { id: 'dom-mestre', nome: 'Marca da Lua', custo: 1, x: 200, y: -30, requer: [],
      efeitos: [{ tipo: 'bonus', alvo: 'atributo:FOR', valor: 2 }] },
  ],
  liberados: ['dom-mestre'],
  concedidos: [],
}

describe('Fase 2: árvore unificada D&D sem migração destrutiva', () => {
  for (const edicao of ['phb2014', 'phb2024'] as const) {
    it('projeta três ramos oficiais de ' + edicao + ' sem duplicar a árvore do mestre', () => {
      const d = fichaVazia(s)
      d.campos = { ...d.campos, classe: 'Guerreiro', especie: 'Elfo', antecedente: 'Soldado', nivel: 5 }
      d.dndLivros = { base: edicao, suplementos: [] }
      d.arvore = extras
      const antes = JSON.stringify(d)
      const oficiais = hexagonosOficiaisDnd(d, edicao, null, true)
      const organizados = ordenarNosVerticais(oficiais)
      expect(oficiais.length).toBeGreaterThan(0)
      expect(oficiais.some(n => n.ramo === 'classe')).toBe(true)
      expect(oficiais.some(n => n.ramo === 'especie')).toBe(true)
      expect(oficiais.some(n => n.ramo === 'antecedente')).toBe(true)
      expect(oficiais.some(n => n.ramo === 'mestre')).toBe(false)
      expect(organizados).toHaveLength(oficiais.length)
      expect(organizados.every((n, i, arr) => i === 0 || n.nivel >= arr[i - 1].nivel)).toBe(true)
      expect(JSON.stringify(d)).toBe(antes)
      const a = lerArvore(d.arvore)
      expect(a.nos.map(n => n.id)).toEqual(['dom-mestre'])
      expect(a.liberados).toEqual(['dom-mestre'])
      expect(bonusDaArvore(a, d)['atributo:FOR']).toBe(2)
      expect(poderesDaArvore(a, d)).toHaveLength(0)
    })
  }
  it('nível e espécie novos reconstroem o ramo sem escrever nada nas habilidades do mestre', () => {
    const d = fichaVazia(s)
    d.campos = { ...d.campos, classe: 'Guerreiro', especie: 'Elfo', antecedente: 'Soldado', nivel: 1 }
    d.arvore = extras
    const anterior = JSON.stringify(d.arvore)
    const antes = hexagonosOficiaisDnd(d, 'phb2024', null, true)
    d.campos = { ...d.campos, especie: 'Humano', nivel: 5 }
    const depois = hexagonosOficiaisDnd(d, 'phb2024', null, true)
    expect(antes).not.toEqual(depois)
    expect(JSON.stringify(d.arvore)).toBe(anterior)
  })
})
