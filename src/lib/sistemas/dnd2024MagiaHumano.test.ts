import { describe, expect, it } from 'vitest'
import { fichaVazia, calcular, normalizarFicha } from './calculo'
import { aplicarDescanso } from './descanso'
import { sistemaPorId } from './catalogo'
import { MAGIAS_SRD } from './dnd2024Magias'
import { aplicarAntecedenteDnd, magiasDeAntecedenteDnd } from './dnd2024Antecedentes'
import {
  magiasDoHumanoDnd, humanoTemIniciado, validarTalentoMagiaHumano,
  validarAlteracoesTalentoMagiaHumano,
  type ListaIniciado, type RegistroTalentoMagiaHumano,
} from './dnd2024MagiaHumano'
import { etapasCriacaoDnd2024 } from './guiaCriacaoDnd2024'

const sistema = sistemaPorId('dnd5e-srd')!
const ids = (lista: ListaIniciado): [string, string, string] => {
  const truques = MAGIAS_SRD.filter(m => m.nivel === 0 && m.classes.includes(lista))
  const magia = MAGIAS_SRD.find(m => m.nivel === 1 && m.classes.includes(lista))!
  return [truques[0].id, truques[1].id, magia.id]
}
const base = () => {
  const d = fichaVazia(sistema)
  return { ...d, campos: { ...d.campos, especie: 'Humano', antecedente: 'Soldado', classe: 'Guerreiro', nivel: 1 },
    dndEscolhas: { 'esp-humano-tamanho': 'medio', 'esp-humano-habilidoso': 'percepcao', 'esp-humano-versatil': 'iniciado-magia' } }
}
const humano = (lista: ListaIniciado = 'mago'): RegistroTalentoMagiaHumano =>
  ({ lista, atributo: 'CAR', magias: ids(lista) })

describe('D&D 2024: Iniciado em Magia do Humano Versátil', () => {
  it('só ativa com a espécie e talento correspondentes, e exige três magias válidas', () => {
    const d = base()
    expect(humanoTemIniciado(d)).toBe(true)
    expect(magiasDoHumanoDnd(d)).toBeNull()
    const completo = { ...d, dndTalentoHumano: humano() }
    expect(validarTalentoMagiaHumano(completo)).toEqual([])
    expect(magiasDoHumanoDnd(completo)).toMatchObject({ antecedente: 'Humano Versátil', atributo: 'CAR', lista: 'mago', ids: ids('mago') })
    expect(magiasDoHumanoDnd({ ...completo, campos: { ...completo.campos, especie: 'Elfo' } })).toBeNull()
    expect(magiasDoHumanoDnd({ ...completo, dndEscolhas: { ...completo.dndEscolhas, 'esp-humano-versatil': 'alerta' } })).toBeNull()
  })
  it('não aceita lista repetida do antecedente nem duplicação de truques', () => {
    const d = { ...base(), campos: { ...base().campos, antecedente: 'Acólito' } }
    expect(validarTalentoMagiaHumano({ ...d, dndTalentoHumano: humano('clerigo') }).join(' ')).toContain('diferente')
    const errado = humano('mago')
    errado.magias[1] = errado.magias[0]
    expect(validarTalentoMagiaHumano({ ...d, dndTalentoHumano: errado }).join(' ')).toContain('distintos')
    expect(validarTalentoMagiaHumano({ ...d, dndTalentoHumano: humano('druida') })).toEqual([])
  })
  it('a API rejeita novas escolhas fora do Humano, mas mantém registro antigo ao trocar de espécie', () => {
    const antes = base()
    const completo = { ...antes, dndTalentoHumano: humano() }
    expect(validarAlteracoesTalentoMagiaHumano(antes, completo)).toEqual([])
    const outraEspecie = { ...completo, campos: { ...completo.campos, especie: 'Elfo' } }
    expect(validarAlteracoesTalentoMagiaHumano(completo, outraEspecie)).toEqual([])
    expect(validarAlteracoesTalentoMagiaHumano({ ...outraEspecie, dndTalentoHumano: undefined }, outraEspecie).length).toBeGreaterThan(0)
  })
  it('mantém magias de Humano e antecedente em fontes diferentes, com descanso independente', () => {
    const d = { ...base(), campos: { ...base().campos, antecedente: 'Acólito' } }
    const criado = aplicarAntecedenteDnd(d, { INT: 2, SAB: 1 }, {
      equipamento: 'pacote', talentoAtributo: 'SAB', talentoMagias: ids('clerigo'),
    })
    expect(criado.ok).toBe(true)
    if (!criado.ok) return
    const completo = { ...criado.dados, dndTalentoHumano: humano('mago'),
      recursos: { ...criado.dados.recursos, magia_humano_gratis: { atual: 1 } } }
    expect(magiasDeAntecedenteDnd(completo)?.lista).toBe('clerigo')
    expect(magiasDoHumanoDnd(completo)?.lista).toBe('mago')
    const c = calcular(sistema, completo)
    expect(c.recursosMax.magia_origem_gratis).toBe(1)
    expect(c.recursosMax.magia_humano_gratis).toBe(1)
    const gasto = { ...completo, recursos: { ...completo.recursos, magia_origem_gratis: { atual: 0 }, magia_humano_gratis: { atual: 0 } } }
    expect(aplicarDescanso(sistema, gasto, 'curto').d.recursos.magia_humano_gratis.atual).toBe(0)
    const longo = aplicarDescanso(sistema, gasto, 'longo').d
    expect(longo.recursos.magia_humano_gratis.atual).toBe(1)
    expect(longo.recursos.magia_origem_gratis.atual).toBe(1)
    expect(normalizarFicha(sistema, completo).dndTalentoHumano).toEqual(humano('mago'))
    expect(completo.dndMagias).toBeUndefined()
  })
  it('guia exige as escolhas pendentes e depois confirma apenas a parte do Humano', () => {
    const d = base()
    expect(etapasCriacaoDnd2024(d).find(e => e.id === 'magias')?.estado).toBe('pendente')
    const completo = { ...d, dndTalentoHumano: humano() }
    expect(etapasCriacaoDnd2024(completo).find(e => e.id === 'magias')?.descricao).toContain('confirmado')
    expect(etapasCriacaoDnd2024(completo).find(e => e.id === 'revisao')?.estado).toBe('revisar')
  })
})
