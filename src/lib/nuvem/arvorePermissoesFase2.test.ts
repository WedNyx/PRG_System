import { describe, expect, it } from 'vitest'
import { aplicar, categoria, diferencas, separarPorRegra } from './categorias'
import { normalizarExcecoes, normalizarPermissoes, podeAdministrar } from './validacao'

/** Testes de regressão do ramo extra da árvore no fluxo de autorização da campanha. */
describe('Fase 2: permissões do mestre sobre a árvore D&D', () => {
  const antigo = {
    nome: 'Aventureiro QA',
    campos: { classe: 'Guerreiro', nivel: 1 },
    arvore: { pontos: 0, nos: [], liberados: [], concedidos: [] },
    poderes: [],
  }
  const depois = {
    ...antigo,
    nome: 'Aventureiro QA Atualizado',
    arvore: {
      pontos: 1,
      nos: [{ id: 'qa', nome: 'Marca Lunar', custo: 1, requer: [], efeitos: [] }],
      liberados: ['qa'],
      concedidos: [],
    },
  }

  it('árvore e poderes continuam na mesma categoria de autorização', () => {
    expect(categoria('dnd5e-srd', 'arvore')).toBe('habilidades')
    expect(categoria('dnd5e-srd', 'poderes')).toBe('habilidades')
    expect(categoria('dnd5e-srd', 'campos.nivel')).toBe('nivel')
  })

  it('modelo C: edição de identidade salva, ramo do mestre vira aprovação sem modificar a ficha', () => {
    const mudanças = diferencas('dnd5e-srd', antigo, depois)
    const separadas = separarPorRegra(mudanças, normalizarPermissoes({}, 'C'), {})
    expect(separadas.livres.map(x => x.categoria)).toEqual(['identidade'])
    expect(separadas.aprovacao.map(x => x.categoria)).toEqual(['habilidades'])
    const salvo = aplicar(antigo, separadas.livres)
    expect(salvo.nome).toBe('Aventureiro QA Atualizado')
    expect(salvo.arvore).toEqual(antigo.arvore)
  })

  it('modelo B: habilidades do mestre são bloqueadas para jogadores', () => {
    const separadas = separarPorRegra(
      diferencas('dnd5e-srd', antigo, depois),
      normalizarPermissoes({}, 'B'), {},
    )
    expect(separadas.bloqueadas.map(x => x.categoria).sort()).toEqual(['habilidades', 'identidade'])
    expect(aplicar(antigo, separadas.livres)).toEqual(antigo)
  })

  it('modelo A permite mudanças de jogador, salvo exceção pessoal do mestre', () => {
    const mudanças = diferencas('dnd5e-srd', antigo, depois)
    const padrao = normalizarPermissoes({}, 'A')
    expect(separarPorRegra(mudanças, padrao, {}).livres).toHaveLength(2)
    const excecao = normalizarExcecoes({ habilidades: 'mestre' })
    const separadas = separarPorRegra(mudanças, padrao, excecao)
    expect(separadas.bloqueadas.map(x => x.categoria)).toEqual(['habilidades'])
    expect(separadas.livres.map(x => x.categoria)).toEqual(['identidade'])
  })

  it('somente mestre e co-mestre administram; espectadores e jogadores não', () => {
    expect(podeAdministrar('mestre')).toBe(true)
    expect(podeAdministrar('comestre')).toBe(true)
    expect(podeAdministrar('jogador')).toBe(false)
    expect(podeAdministrar('espectador')).toBe(false)
  })
})
