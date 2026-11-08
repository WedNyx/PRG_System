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
