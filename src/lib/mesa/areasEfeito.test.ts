import { describe, expect, it } from 'vitest'
import { anguloEntre, contornoArea, lerAreasEfeito, normalizarAreaEfeito, pontoNaArea, tokensNaArea, type AreaEfeito } from './areasEfeito'

const area = (x: Partial<AreaEfeito>): AreaEfeito => ({ id: 'a1234567', forma: 'circulo', x: 5.5, y: 5.5, angulo: 0, metros: 6, cor: '#f97316', nome: '', ...x })
const tk = (id: string, x: number, y: number, tamanho = 1) => ({ id, x, y, tamanho })

describe('áreas de efeito (v0.34.9)', () => {
  it('círculo de 6 m (4 células) pega quem está a até 4 células do centro', () => {
    const a = area({ forma: 'circulo' })
    expect(tokensNaArea(a, [tk('perto', 8, 5), tk('borda', 9, 5), tk('longe', 10, 5)]).map(t => t.id)).toEqual(['perto', 'borda'])
  })

  it('cone para a direita abre conforme se afasta e não pega o que está atrás', () => {
    const a = area({ forma: 'cone', angulo: 0, metros: 9 }) // 6 células
    expect(pontoNaArea(a, 6.5, 5.5)).toBe(true)
    expect(pontoNaArea(a, 10.5, 7.5)).toBe(true) // 5 à frente, 2 para o lado (largura 2,5)
    expect(pontoNaArea(a, 6.5, 7.5)).toBe(false) // 1 à frente, 2 para o lado
    expect(pontoNaArea(a, 3.5, 5.5)).toBe(false) // atrás
    expect(pontoNaArea(a, 12.5, 5.5)).toBe(false) // além do comprimento
  })

  it('linha tem uma célula de largura na direção escolhida', () => {
    const a = area({ forma: 'linha', angulo: 90, metros: 15 }) // para baixo, 10 células
    expect(tokensNaArea(a, [tk('na-linha', 5, 12), tk('ao-lado', 6, 12), tk('acima', 5, 3)]).map(t => t.id)).toEqual(['na-linha'])
  })

  it('quadrado centrado no ponto', () => {
    const a = area({ forma: 'quadrado', metros: 4.5 }) // 3 células
    expect(tokensNaArea(a, [tk('dentro', 6, 6), tk('fora', 7, 7)]).map(t => t.id)).toEqual(['dentro'])
  })

  it('token grande conta se qualquer célula dele estiver dentro', () => {
    const a = area({ forma: 'circulo', metros: 1.5 })
    expect(tokensNaArea(a, [tk('grande', 4, 6, 2), tk('pequeno', 7, 7)]).map(t => t.id)).toEqual(['grande'])
  })

  it('valida o que vem do navegador', () => {
    expect(normalizarAreaEfeito({ forma: 'estrela', x: 1, y: 1, metros: 6 }, 20, 20)).toBeNull()
    expect(normalizarAreaEfeito({ forma: 'circulo', x: 50, y: 1, metros: 6 }, 20, 20)).toBeNull()
    expect(normalizarAreaEfeito({ forma: 'circulo', x: 1, y: 1, metros: 9999 }, 20, 20)).toBeNull()
    const a = normalizarAreaEfeito({ forma: 'cone', x: 3.26, y: 4.74, metros: 9, angulo: -90, cor: 'vermelho', nome: '  Sopro  ' }, 20, 20)!
    expect(a).toMatchObject({ forma: 'cone', x: 3.5, y: 4.5, angulo: 270, cor: '#f97316', nome: 'Sopro' })
    expect(lerAreasEfeito([a, { lixo: true }, null], 20, 20)).toHaveLength(1)
  })

  it('contorno e direção', () => {
    expect(contornoArea(area({ forma: 'circulo' }))).toEqual({ tipo: 'circulo', cx: 5.5, cy: 5.5, r: 4 })
    const c = contornoArea(area({ forma: 'cone', metros: 3 }))
    expect(c.tipo === 'poligono' && c.pontos.length).toBe(3)
    expect(anguloEntre(0, 0, 0, 5)).toBe(90)
    expect(anguloEntre(0, 0, -5, 0)).toBe(180)
  })
})
