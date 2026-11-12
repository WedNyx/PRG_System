import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { calcular, fichaVazia } from './calculo'
import { conferirFichaGenerica } from './conferencia'

const conf = (id: string, mudar: (d: ReturnType<typeof fichaVazia>) => void = () => {}) => {
  const s = sistemaPorId(id)!; const d = fichaVazia(s); mudar(d); return conferirFichaGenerica(s, d, calcular(s, d))
}
describe('conferência genérica', () => {
  it('Tormenta20 vazia: pede raça, classe, atributos e PV', () => {
    const r = conf('tormenta20').map(x => x.texto).join(' | ')
    expect(r).toMatch(/Escolha: Raça/); expect(r).toMatch(/Escolha: Classe/); expect(r).toMatch(/atributos/); expect(r).toMatch(/Pontos de Vida|PV/)
    expect(r).not.toMatch(/Armadura/)
  })
  it('Ordem Paranormal pronta: só ok', () => {
    const r = conf('ordem-paranormal', d => { d.nome = 'Ana'; d.campos.classe = 'Combatente'; Object.assign(d.atributos, { AGI: 2, FOR: 2, INT: 1, PRE: 1, VIG: 3 }) })
    expect(r.filter(x => x.tipo !== 'ok')).toEqual([])
  })
  it('limite passado vira erro (Ordem Paranormal com atributos demais)', () => {
    const r = conf('ordem-paranormal', d => { d.nome = 'Ana'; d.campos.classe = 'Combatente'; Object.assign(d.atributos, { AGI: 3, FOR: 3, INT: 3, PRE: 3, VIG: 3 }) })
    expect(r.some(x => x.tipo === 'erro')).toBe(true)
  })
})
