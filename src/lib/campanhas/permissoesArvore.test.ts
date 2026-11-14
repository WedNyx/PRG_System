import { describe, expect, it } from 'vitest'
import { podeDesbloquearArvore } from './permissoes'

describe('Desbloquear habilidades sem ser editor da árvore do mestre', () => {
  it('dono de ficha avulsa pode desbloquear; ficha em somente leitura não', () => {
    expect(podeDesbloquearArvore(false, true, false)).toBe(true)
    expect(podeDesbloquearArvore(false, false, false)).toBe(false)
  })
  it('mestre/co-mestre edita quando a ficha permite', () => {
    expect(podeDesbloquearArvore(true, true, true)).toBe(true)
  })
  it('jogador: regras livre e aprovação permitem desbloqueio, somente mestre bloqueia', () => {
    expect(podeDesbloquearArvore(true, true, false, 'livre')).toBe(true)
    expect(podeDesbloquearArvore(true, true, false, 'aprovacao')).toBe(true)
    expect(podeDesbloquearArvore(true, true, false, 'mestre')).toBe(false)
  })
  it('bloqueio da ficha ou falta da regra impede, inclusive para ex-dono espectador', () => {
    expect(podeDesbloquearArvore(true, false, false, 'livre')).toBe(false)
    expect(podeDesbloquearArvore(true, true, false)).toBe(false)
  })
})
