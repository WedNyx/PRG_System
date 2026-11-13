import { describe, expect, it } from 'vitest'
import { fichaVazia, calcular } from './calculo'
import { aplicarDescanso } from './descanso'
import { sistemaPorId } from './catalogo'
import { MAGIAS_SRD } from './dnd2024Magias'
import { magiasDeAntecedenteDnd, aplicarAntecedenteDnd } from './dnd2024Antecedentes'
import { contarMagias, lerMagiasDnd, limitesMagiasDnd } from './dnd2024Conjuracao'

const s = sistemaPorId('dnd5e-srd')!
const inicial = (bg: string, cls = 'Guerreiro') => {
  const d = fichaVazia(s)
  return { ...d, campos: { ...d.campos, classe: cls, antecedente: bg, nivel: 1 } }
}
const escolhasClerigo = () => {
  const truques = MAGIAS_SRD.filter(m => m.nivel === 0 && m.classes.includes('clerigo')).slice(0, 2)
  const nivel1 = MAGIAS_SRD.find(m => m.nivel === 1 && m.classes.includes('clerigo'))!
  return [truques[0].id, truques[1].id, nivel1.id]
}

describe('D&D 2024: integração de talentos de origem', () => {
  it('exibe Iniciado em Magia apenas quando a origem e suas escolhas foram confirmadas', () => {
    const d = inicial('Acólito')
    expect(magiasDeAntecedenteDnd(d)).toBeNull()
    const r = aplicarAntecedenteDnd(d, { INT: 2, SAB: 1 }, {
      equipamento: 'pacote', talentoAtributo: 'CAR', talentoMagias: escolhasClerigo(),
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(magiasDeAntecedenteDnd(r.dados)).toMatchObject({
      antecedente: 'Acólito', lista: 'clerigo', atributo: 'CAR', ids: escolhasClerigo(),
    })
    expect(calcular(s, r.dados).recursosMax.magia_origem_gratis).toBe(1)
    expect(r.dados.recursos.magia_origem_gratis?.atual).toBe(1)
    expect(r.dados.dndMagias).toBeUndefined()
    expect(contarMagias(lerMagiasDnd(r.dados.dndMagias), limitesMagiasDnd(r.dados)).preparadas).toBe(0)
  })
  it('refaz o único uso gratuito após descanso longo, mas não após descanso curto', () => {
    const r = aplicarAntecedenteDnd(inicial('Acólito'), { INT: 2, SAB: 1 }, {
      equipamento: 'moedas', talentoAtributo: 'SAB', talentoMagias: escolhasClerigo(),
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const gasto = { ...r.dados, recursos: { ...r.dados.recursos, magia_origem_gratis: { atual: 0 } } }
    expect(aplicarDescanso(s, gasto, 'curto').d.recursos.magia_origem_gratis.atual).toBe(0)
    expect(aplicarDescanso(s, gasto, 'longo').d.recursos.magia_origem_gratis.atual).toBe(1)
  })
  it('trocar o antecedente suspende magias e máximo do recurso sem apagar o registro', () => {
    const r = aplicarAntecedenteDnd(inicial('Acólito'), { INT: 2, SAB: 1 }, {
      equipamento: 'pacote', talentoAtributo: 'INT', talentoMagias: escolhasClerigo(),
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const outro = { ...r.dados, campos: { ...r.dados.campos, antecedente: 'Soldado' } }
    expect(magiasDeAntecedenteDnd(outro)).toBeNull()
    expect(calcular(s, outro).recursosMax.magia_origem_gratis).toBe(0)
    expect(r.dados.dndAntecedente?.id).toBe('acolito')
  })
  it('Mago com Iniciado em Magia de Clérigo usa o atributo registrado, sem alterar a tabela de classe', () => {
    const d = inicial('Acólito', 'Mago')
    d.atributos.INT = 16
    d.atributos.CAR = 14
    const r = aplicarAntecedenteDnd(d, { SAB: 2, CAR: 1 }, {
      equipamento: 'pacote', talentoAtributo: 'CAR', talentoMagias: escolhasClerigo(),
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const c = calcular(s, r.dados)
    const origin = magiasDeAntecedenteDnd(r.dados)!
    expect(origin.atributo).toBe('CAR')
    expect(8 + c.vars.dnd_prof + c.mods[origin.atributo]).not.toBe(c.derivados.cd_magia)
    expect(limitesMagiasDnd(r.dados).atributo).toBe('INT')
  })
})
