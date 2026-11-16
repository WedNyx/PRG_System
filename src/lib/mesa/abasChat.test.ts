import { describe, expect, it } from 'vitest'
import { separarEventos, type EventoChat } from './abasChat'

const M = 'mestre-id', J = 'jogador-id'
const papel = { [M]: 'mestre', [J]: 'jogador' }
const ev = (id: number, tipo: EventoChat['tipo'], autor: string, texto: string | null = null): EventoChat => ({ id, tipo, autor_id: autor, texto })

describe('abas do chat da mesa (v0.34.9)', () => {
  it('separa conversa, dados, combate e mestre', () => {
    const lista = [
      ev(1, 'chat', J, 'oi'),
      ev(2, 'sistema', M, '🟢 O mestre abriu a sessão.'),
      ev(3, 'rolagem', J), ev(4, 'rolagem', M), ev(5, 'sistema', M, '🎲 Encontros: 3 lobos'),
      ev(6, 'sistema', M, '⚔️ O combate começou! Ordem: …'),
      ev(7, 'rolagem', J), ev(8, 'ataque', J), ev(9, 'rolagem', M), ev(10, 'chat', M, 'cuidado!'),
      ev(11, 'sistema', M, '🏳️ Fim do combate.'),
      ev(12, 'rolagem', J),
    ]
    const a = separarEventos(lista, papel, false)
    expect([...a.entries()].sort((x, y) => x[0] - y[0]).map(([, v]) => v)).toEqual([
      'conversa', 'dados', 'dados', 'mestre', 'mestre', 'combate', 'combate', 'combate', 'combate', 'conversa', 'combate', 'dados'])
  })

  it('combate que começou antes das mensagens carregadas continua contando como combate', () => {
    const a = separarEventos([ev(50, 'rolagem', J), ev(51, 'rolagem', M)], papel, true)
    expect([a.get(50), a.get(51)]).toEqual(['combate', 'combate'])
  })

  it('ataque é sempre combate, mesmo fora da ordem de iniciativa', () => {
    expect(separarEventos([ev(1, 'ataque', J)], papel, false).get(1)).toBe('combate')
  })
})
