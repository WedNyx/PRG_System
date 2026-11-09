import { describe, expect, it } from 'vitest'
import { aplicarNevoa, filtroVisibilidade, normalizarCondicoes, normalizarIniciativa, normalizarPontos, podeVerEvento, urlValida } from './mesa'

const M = 'mestre', J = 'jog', O = 'outro'
describe('visibilidade do chat e rolagens', () => {
  it('pública: todos; secreta para o mestre: autor e mestres; privada: autor e destinatário', () => {
    expect(podeVerEvento({ autor_id: J, visibilidade: 'publica', destinatario_id: null }, O, false)).toBe(true)
    const secreta = { autor_id: J, visibilidade: 'mestre' as const, destinatario_id: null }
    expect(podeVerEvento(secreta, J, false)).toBe(true)
    expect(podeVerEvento(secreta, M, true)).toBe(true)
    expect(podeVerEvento(secreta, O, false)).toBe(false)
    const privada = { autor_id: M, visibilidade: 'privada' as const, destinatario_id: J }
    expect(podeVerEvento(privada, J, false)).toBe(true)
    expect(podeVerEvento(privada, O, false)).toBe(false)
    expect(podeVerEvento(privada, 'outro-mestre', true)).toBe(false)
  })
  it('filtro do banco só inclui "mestre" para quem administra', () => {
    expect(filtroVisibilidade(J, false)).not.toContain('visibilidade.eq.mestre')
    expect(filtroVisibilidade(M, true)).toContain('visibilidade.eq.mestre')
  })
})
describe('névoa', () => {
  it('revela, esconde e ignora células inválidas ou fora do mapa', () => {
    let f = aplicarNevoa([], ['1,1', '2,2', 'x', '99,1', '1,1'], true, 20, 15)
    expect(f.sort()).toEqual(['1,1', '2,2'])
    f = aplicarNevoa(f, ['1,1'], false, 20, 15)
    expect(f).toEqual(['2,2'])
  })
})
describe('iniciativa e outros', () => {
  it('ordena e descarta entradas inválidas', () => {
    const l = normalizarIniciativa([{ nome: 'A', valor: 5 }, { nome: '', valor: 9 }, { nome: 'B', valor: '12' }, 'x'])
    expect(l.map(e => e.nome)).toEqual(['B', 'A'])
  })
  it('condições conhecidas apenas', () => expect(normalizarCondicoes(['caido', 'hack', 'cego'])).toEqual(['caido', 'cego']))
  it('urls só https', () => { expect(urlValida('https://x/y.png')).toBe(true); expect(urlValida('javascript:alert(1)')).toBe(false) })
  it('pontos do desenho', () => { expect(normalizarPontos([1, 2, 3, 4])).toEqual([1, 2, 3, 4]); expect(normalizarPontos([1, 2, 3])).toBeNull() })
})

import { celulasPincel, celulasRetangulo, normalizarCamadas, podeMoverToken, todasCelulas } from './mesa'
describe('v0.6.0 — mapa e tokens', () => {
  it('camadas: só https, limites e máximo de 30', () => {
    expect(normalizarCamadas([{ url: 'https://a/b.png', x: 2, y: 3, w: 10, h: 5 }], 20, 15)?.[0]).toMatchObject({ x: 2, y: 3, w: 10, h: 5 })
    expect(normalizarCamadas([{ url: 'data:image/png;base64,AA', x: 0, y: 0, w: 1, h: 1 }], 20, 15)).toBeNull()
    expect(normalizarCamadas(Array(31).fill({ url: 'https://a/b.png' }), 20, 15)).toBeNull()
    expect(normalizarCamadas([{ url: 'https://a/b.png', w: 0, h: 999 }], 20, 15)?.[0]).toMatchObject({ w: 1, h: 200 })
  })
  it('retângulo e pincel', () => {
    expect(celulasRetangulo(2, 2, 1, 1).sort()).toEqual(['1,1', '1,2', '2,1', '2,2'])
    expect(celulasPincel(0, 0, 3).sort()).toEqual(['0,0', '0,1', '1,0', '1,1'])
    expect(todasCelulas(3, 2).length).toBe(6)
  })
  it('quem move o token', () => {
    const t = { movimento: 'dono' as const, dono_id: 'j' }
    expect(podeMoverToken(t, 'j', false, false)).toBe(true)
    expect(podeMoverToken(t, 'outro', false, false)).toBe(false)
    expect(podeMoverToken({ ...t, movimento: 'todos' }, 'outro', false, false)).toBe(true)
    expect(podeMoverToken({ ...t, movimento: 'mestre' }, 'j', false, false)).toBe(false)
    expect(podeMoverToken(t, 'j', false, true)).toBe(false)
    expect(podeMoverToken({ ...t, movimento: 'mestre' }, 'm', true, true)).toBe(true)
  })
})

import { normalizarRecorte } from './mesa'
describe('recorte de imagem do mapa', () => {
  it('guarda o recorte e corrige bordas', () => {
    expect(normalizarRecorte({ cx: 0.25, cy: 0.1, cw: 0.5, ch: 0.5 })).toEqual({ cx: 0.25, cy: 0.1, cw: 0.5, ch: 0.5 })
    expect(normalizarRecorte({ cx: 0.9, cy: 0, cw: 0.5, ch: 1 })).toEqual({ cx: 0.5, cy: 0, cw: 0.5, ch: 1 })
    expect(normalizarRecorte({ cx: 0, cy: 0, cw: 1, ch: 1 })).toBeNull()
    expect(normalizarRecorte({})).toBeNull()
    expect(normalizarRecorte({ cw: 0, ch: 0.001 })).toMatchObject({ cw: 0.02, ch: 0.02 })
  })
  it('camada leva o recorte junto', () => {
    expect(normalizarCamadas([{ url: 'https://a/b.png', w: 5, h: 5, cx: 0.5, cy: 0.5, cw: 0.5, ch: 0.5 }], 20, 15)?.[0]).toMatchObject({ cx: 0.5, cw: 0.5 })
  })
})
