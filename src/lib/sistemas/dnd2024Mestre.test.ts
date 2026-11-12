import { describe, expect, it } from 'vitest'
import { CONDICOES_DND, conferirFichaDnd, montarEncontro, nivelPeloXp, proficienciaDoNd, xpDoNd, XP_POR_ND } from './dnd2024Mestre'
import { sistemaPorId } from './catalogo'
import { calcular, fichaVazia } from './calculo'

const s = sistemaPorId('dnd5e-srd')!

describe('encontros (SRD 5.2.1, Gameplay Toolbox)', () => {
  it('exemplo 1 do SRD: 4 personagens de nível 1, baixa = 200 XP; 1 Urso-bugbear (ND 1) cabe', () => {
    const e = montarEncontro([1, 1, 1, 1], [{ nome: 'Bugbear', nd: '1', qtd: 1 }], 'baixa')
    expect(e.orcamento).toEqual({ baixa: 200, moderada: 300, alta: 400 })
    expect(e.gasto).toBe(200); expect(e.faixa).toBe('baixa'); expect(e.sobra).toBe(0); expect(e.xpPorPersonagem).toBe(50)
  })
  it('exemplo 2: 5 de nível 3, moderada = 1.125; 2 ND 2 + 9 ND 1/8 = 1.125', () => {
    const e = montarEncontro([3, 3, 3, 3, 3], [{ nome: 'Druida', nd: '2', qtd: 2 }, { nome: 'Estirge', nd: '1/8', qtd: 9 }])
    expect(e.orcamento.moderada).toBe(1125); expect(e.gasto).toBe(1125); expect(e.faixa).toBe('moderada')
    // 11 criaturas para 5 personagens: o aviso lembra de usar criaturas frágeis (as estirges são).
    expect(e.avisos.some(a => /2 criaturas por personagem/.test(a))).toBe(true)
  })
  it('exemplo 3: 6 de nível 15, alta = 46.800; 2 ND 17 + 2 ND 9 = 46.000', () => {
    const e = montarEncontro(Array(6).fill(15), [{ nome: 'Dragão', nd: '17', qtd: 2 }, { nome: 'Gigante', nd: '9', qtd: 2 }], 'alta')
    expect(e.orcamento.alta).toBe(46800); expect(e.gasto).toBe(46000); expect(e.faixa).toBe('alta')
  })
  it('grupo de níveis diferentes soma o orçamento de cada um; avisos de muitas criaturas e ND alto', () => {
    const e = montarEncontro([1, 2], [{ nome: 'Ogro', nd: '2', qtd: 1 }, { nome: 'Rato', nd: '1/8', qtd: 4 }], 'alta')
    expect(e.orcamento.alta).toBe(300)
    expect(e.faixa).toBe('acima')
    expect(e.avisos.join(' ')).toMatch(/Mais de 2 criaturas/); expect(e.avisos.join(' ')).toMatch(/Ogro ND 2/)
  })
  it('tabelas: XP por ND e proficiência', () => {
    expect(XP_POR_ND).toHaveLength(34); expect(xpDoNd('1/4')).toBe(50); expect(xpDoNd('30')).toBe(155000)
    expect(['0', '4', '5', '8', '9', '13', '17', '21', '29'].map(proficienciaDoNd)).toEqual([2, 2, 3, 3, 4, 5, 6, 7, 9])
    expect([0, 299, 300, 6500, 355000].map(nivelPeloXp)).toEqual([1, 1, 2, 5, 20])
    expect(CONDICOES_DND).toHaveLength(15)
  })
})

describe('conferência da ficha', () => {
  const ficha = (campos: Record<string, string | number>, atributos: Record<string, number> = {}, extra: object = {}) => {
    const d = { ...fichaVazia(s), ...extra }
    Object.assign(d.campos, campos); Object.assign(d.atributos, atributos)
    return d
  }
  const conferir = (d: ReturnType<typeof ficha>) => conferirFichaDnd(d, calcular(s, d))
  it('ficha vazia: pede classe, espécie, antecedente e atributos', () => {
    const r = conferir(ficha({}))
    const erros = r.filter(x => x.tipo === 'erro').map(x => x.texto).join(' | ')
    expect(erros).toMatch(/classe/); expect(erros).toMatch(/espécie/); expect(erros).toMatch(/antecedente/); expect(erros).toMatch(/atributos/)
  })
  it('Mago 1 pronto, mas com magias por escolher e escolha pendente', () => {
    const d = ficha({ classe: 'Mago', nivel: 1, especie: 'Humano', antecedente: 'Sábio' }, { FOR: 8, DES: 14, CON: 13, INT: 17, SAB: 12, CAR: 10 }, { dndMagias: { 'fire-bolt': 'preparada' } })
    const r = conferir(d)
    expect(r.some(x => x.tipo === 'erro')).toBe(false)
    expect(r.find(x => /Mago: ainda dá/.test(x.texto))?.texto).toMatch(/2 truque\(s\) e 4 magia/)
    expect(r.some(x => /escolha\(s\) pendente/.test(x.texto))).toBe(true)
  })
  it('passou do limite de magias e XP para subir de nível', () => {
    const d = ficha({ classe: 'Mago', nivel: 1, especie: 'Humano', antecedente: 'Sábio', xp: 400 }, { INT: 16, DES: 14 }, { dndMagias: { 'fire-bolt': 'preparada', 'mage-hand': 'preparada', light: 'preparada', message: 'preparada' } })
    const r = conferir(d)
    expect(r.find(x => x.tipo === 'erro')?.texto).toMatch(/4 truques, o limite é 3/)
    expect(r.some(x => /pode chegar ao nível 2/.test(x.texto))).toBe(true)
  })
})
