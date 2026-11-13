import { describe, expect, it } from 'vitest'
import { bonusDaArvore, concederNo, lerArvore, noAtivo, podeLiberar, poderesDaArvore, requisitoFichaAtendido, sincronizarPoderes } from './arvore'
import { calcular, fichaVazia, normalizarFicha } from './calculo'
import { sistemaPorId } from './catalogo'

const ARVORE = {
  pontos: 3,
  nos: [{
    id: 'lua', nome: 'Lâmina Lunar', custo: 1, cor: '#a78bfa', x: 0, y: 0, requer: [],
    requisitoFicha: { campo: 'especie', valor: 'elfo' },
    efeitos: [{ tipo: 'bonus', alvo: 'atributo:FOR', valor: 2 },
      { tipo: 'poder', poder: { nome: 'Lâmina Lunar', expressao: '1d6' } }],
  }],
  liberados: ['lua'],
}
const s = sistemaPorId('dnd5e-srd')!
const personagem = (especie: string) => {
  const d = fichaVazia(s)
  return { ...d, campos: { ...d.campos, especie, classe: 'Guerreiro', nivel: 3 } }
}

describe('hexágonos condicionais de D&D 2024', () => {
  it('preserva o requisito no armazenamento e ignora valores inválidos', () => {
    expect(lerArvore(ARVORE).nos[0].requisitoFicha).toEqual({ campo: 'especie', valor: 'elfo' })
    expect(lerArvore({ ...ARVORE, nos: [{ ...ARVORE.nos[0], requisitoFicha: { campo: 'atributo', valor: 'FOR' } }] }).nos[0].requisitoFicha).toBeUndefined()
  })
  it('aplica bônus e poderes apenas enquanto a escolha correspondente estiver ativa', () => {
    const a = lerArvore(ARVORE)
    const elfo = personagem('Elfo')
    const humano = personagem('Humano')
    expect(noAtivo(a, a.nos[0], elfo)).toBe(true)
    expect(noAtivo(a, a.nos[0], humano)).toBe(false)
    expect(bonusDaArvore(a, elfo)['atributo:FOR']).toBe(2)
    expect(bonusDaArvore(a, humano)['atributo:FOR']).toBeUndefined()
    expect(poderesDaArvore(a, humano)).toEqual([])
    expect(sincronizarPoderes(poderesDaArvore(a, elfo), a, humano)).toEqual([])
    expect(a.liberados).toEqual(['lua'])
  })
  it('não permite desbloquear normalmente sem a escolha, mas admite concessão do mestre', () => {
    const a = lerArvore({ ...ARVORE, liberados: [] })
    const humano = personagem('Humano')
    expect(podeLiberar(a, 'lua', 0, 3, humano).ok).toBe(false)
    const concedido = concederNo(a, 'lua')
    expect(concedido.arvore && noAtivo(concedido.arvore, concedido.arvore.nos[0], humano)).toBe(true)
  })
  it('reconhece a classe de multiclasse e a subclasse escolhida', () => {
    const base = lerArvore({ ...ARVORE, nos: [
      { ...ARVORE.nos[0], requisitoFicha: { campo: 'classe', valor: 'mago' } },
      { ...ARVORE.nos[0], id: 'sub', requisitoFicha: { campo: 'subclasse', classeId: 'guerreiro', valor: 'campeao' } },
    ] })
    const d = { ...personagem('Elfo'), dndMulticlasse: { mago: 1 }, dndEscolhas: { 'guerreiro-subclasse': 'campeao' } }
    expect(requisitoFichaAtendido(base.nos[0], d)).toBe(true)
    expect(requisitoFichaAtendido(base.nos[1], d)).toBe(true)
    expect(requisitoFichaAtendido(base.nos[1], { ...d, dndEscolhas: {} })).toBe(false)
  })
  it('retira efeitos da ficha ao mudar de espécie sem apagar o nó', () => {
    const elfo = normalizarFicha(s, { ...personagem('Elfo'), arvore: ARVORE })
    const humano = normalizarFicha(s, { ...elfo, campos: { ...elfo.campos, especie: 'Humano' } })
    expect(calcular(s, elfo).vars.FOR - calcular(s, humano).vars.FOR).toBe(2)
    expect((humano.poderes as { id: string }[]).some(p => p.id.startsWith('arv-'))).toBe(false)
    expect(lerArvore(humano.arvore).liberados).toEqual(['lua'])
  })
})
