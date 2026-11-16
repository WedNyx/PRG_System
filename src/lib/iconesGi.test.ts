import { describe, expect, it } from 'vitest'
import { buscarIconesGi, ehIconeGi, partesIconeGi, urlIconeGi, type IndiceGi } from './iconesGi'
import { normalizarItem } from './sistemas/inventario'

const indice: IndiceGi = { total: 4, autores: { lorc: 'Lorc', delapouite: 'Delapouite' }, icones: [['lorc', 'broadsword'], ['delapouite', 'revolver'], ['lorc', 'potion-ball'], ['delapouite', 'skull-crossed-bones']] }

describe('acervo completo do Game-Icons (v0.35.3)', () => {
  it('valida o id e monta o endereço do arquivo', () => {
    expect(ehIconeGi('gi:lorc/broadsword')).toBe(true)
    expect(ehIconeGi('gi:../../etc/passwd')).toBe(false)
    expect(ehIconeGi('gi:lorc/Broadsword')).toBe(false)
    expect(urlIconeGi('gi:lorc/broadsword')).toBe('/icones/gi/lorc/broadsword.svg')
    expect(partesIconeGi('gi:delapouite/revolver')).toEqual({ autor: 'delapouite', nome: 'revolver' })
  })
  it('busca em português ou inglês e por tema', () => {
    expect(buscarIconesGi(indice, 'espada').map(i => i[1])).toEqual(['broadsword'])
    expect(buscarIconesGi(indice, 'Poção').map(i => i[1])).toEqual(['potion-ball'])
    expect(buscarIconesGi(indice, 'skull').map(i => i[1])).toEqual(['skull-crossed-bones'])
    expect(buscarIconesGi(indice, '', 'fogo').map(i => i[1])).toEqual(['revolver'])
  })
  it('o item guarda um ícone do acervo', () => {
    expect(normalizarItem({ nome: 'Colt', categoria: 'arma', iconeBiblioteca: 'gi:delapouite/revolver' })!.iconeBiblioteca).toBe('gi:delapouite/revolver')
    expect(normalizarItem({ nome: 'X', categoria: 'arma', iconeBiblioteca: 'gi:<script>/x' })!.iconeBiblioteca).not.toBe('gi:<script>/x')
  })
})
