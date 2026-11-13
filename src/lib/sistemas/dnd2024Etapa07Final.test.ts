import { describe, expect, it } from 'vitest'
import { fichaVazia, calcular } from './calculo'
import { sistemaPorId } from './catalogo'
import { aplicarDescanso } from './descanso'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { progressoDaFichaDnd, validarAlteracoesEscolhasDnd } from './dnd2024Ficha'
import { progressaoVisivel } from './dnd2024Progressao'
import { MARCOS_PERICIAS_CLASSE_DND, periciasClasseDnd } from './dnd2024PericiasClasse'
import { CLASSES_SRD } from './dnd2024Srd'
import { magiasDaEspecieDnd } from './dnd2024MagiasEspecie'
import { CHAVE_ENGENHOCAS_GNOMO, CHAVE_TRUQUE_ALTO_ELFO, altoElfoSelecionado,
  idsRecuperadosEspecieDnd, lerEngenhocasGnomicas, poderesUsaveisEspecieDnd, tracosDeEspecieDnd, truqueAltoElfo,
  TRUQUES_MAGO_ALTO_ELFO } from './dnd2024TracosEspecie'
import type { DadosFicha } from './tipos'

const s = sistemaPorId('dnd5e-srd')!
const criar = (especie: string, nivel = 1, escolhas: Record<string, string> = {}) => {
  const d = fichaVazia(s)
  return { ...d, campos: { ...d.campos, classe: 'Guerreiro', especie, nivel }, dndEscolhas: escolhas }
}
const get = (d: DadosFicha) => poderesUsaveisEspecieDnd(d)

describe('Etapa 7 estendida — poderes e escolhas D&D 2024', () => {
  it('exibe os traços das nove espécies SRD, sem conceder outra espécie ou níveis futuros', () => {
    for (const nome of ['Anão','Draconato','Elfo','Gnomo','Golias','Halfling','Humano','Orc','Tiferino']) {
      const d = criar(nome)
      const tracos = tracosDeEspecieDnd(d)
      expect(tracos.length, nome).toBeGreaterThan(1)
      expect(tracos.every(m => m.origem === 'especie' && m.nivel === 1), nome).toBe(true)
    }
    expect(tracosDeEspecieDnd(criar('Draconato', 4)).some(x => x.id === 'esp-draconato-voo')).toBe(false)
    expect(tracosDeEspecieDnd(criar('Draconato', 5)).some(x => x.id === 'esp-draconato-voo')).toBe(true)
    expect(tracosDeEspecieDnd(criar('Aasimar', 3))).toEqual([])
  })
  it('sopro dracônico acompanha a progressão e os usos de proficiência', () => {
    for (const [nivel, dado, usos] of [[1,'1d10',2],[5,'2d10',3],[11,'3d10',4],[17,'4d10',6]] as const) {
      const d = criar('Draconato', nivel, { 'esp-draconato-ancestral': 'vermelho' })
      const sopro = get(d).find(p => p.nome === 'Arma de Sopro')!
      expect(sopro.expressao).toBe(dado)
      expect(sopro.usosMax).toBe(usos)
      expect(sopro.descricao).toContain('Fogo')
      expect(get(d).some(p => p.nome === 'Voo Dracônico')).toBe(nivel >= 5)
    }
  })
  it('cada poder racial tem recuperação específica, sem tocar poderes caseiros', () => {
    const orc = criar('Orc', 5)
    expect(get(orc).find(p => p.nome === 'Pico de Adrenalina')).toMatchObject({ recarga: 'curto', usosMax: 3 })
    const a = get(orc).find(p => p.nome === 'Pico de Adrenalina')!
    const b = get(orc).find(p => p.nome === 'Resistência Implacável')!
    orc.uso = { itens: {}, carteira: '', poderes: { [a.id]: 2, [b.id]: 1, 'caseiro': 2 } }
    const curto = aplicarDescanso(s, orc, 'curto').d
    expect(curto.uso && (curto.uso as { poderes: Record<string, number> }).poderes[a.id]).toBeUndefined()
    expect((curto.uso as { poderes: Record<string, number> }).poderes[b.id]).toBe(1)
    expect((curto.uso as { poderes: Record<string, number> }).poderes['caseiro']).toBe(2)
    const longo = aplicarDescanso(s, orc, 'longo').d
    expect((longo.uso as { poderes: Record<string, number> }).poderes[b.id]).toBeUndefined()
    expect(idsRecuperadosEspecieDnd(orc, 'curto')).toEqual([a.id])
    expect(idsRecuperadosEspecieDnd(orc, 'longo')).toContain(b.id)
  })
  it('Golias tem escolha de ancestral e poder de Forma Grande no nível 5', () => {
    const d = criar('Golias', 5, { 'esp-golias-ancestralidade': 'pedra' })
    expect(get(d)).toEqual(expect.arrayContaining([expect.objectContaining({
      nome: 'Ancestralidade Gigante', expressao: '1d12', usosMax: 3,
    }), expect.objectContaining({ nome: 'Forma Grande', usosMax: 1 })]))
    expect(get(criar('Golias', 1)).some(p => p.nome === 'Ancestralidade Gigante')).toBe(false)
  })
  it('Alto Elfo troca apenas por truques válidos do Mago registrados no descanso longo', () => {
    const d = criar('Elfo', 5, { 'esp-elfo-linhagem': 'alto-elfo', 'esp-elfo-atributo-magia': 'inteligencia' })
    expect(altoElfoSelecionado(d)).toBe(true)
    expect(TRUQUES_MAGO_ALTO_ELFO.some(x => x.id === 'fire-bolt')).toBe(true)
    expect(truqueAltoElfo(d)).toBe('prestidigitation')
    const modificado = { ...d, listas: { ...d.listas, [CHAVE_TRUQUE_ALTO_ELFO]: 'fire-bolt' } }
    expect(magiasDaEspecieDnd(modificado)?.magias.map(m => m.id))
      .toEqual(['fire-bolt','detect-magic','misty-step'])
    expect(truqueAltoElfo({ ...d, listas: { ...d.listas, [CHAVE_TRUQUE_ALTO_ELFO]: 'forbidden-spell' } })).toBe('prestidigitation')
    expect(magiasDaEspecieDnd({ ...modificado, campos: { ...modificado.campos, especie: 'Humano' } })).toBeNull()
    expect(aplicarDescanso(s, modificado, 'curto').d.listas[CHAVE_TRUQUE_ALTO_ELFO]).toBe('fire-bolt')
  })
  it('engenhocas do Gnomo das Rochas: até 3, não dependem de relógio real e dados antigos são seguros', () => {
    expect(lerEngenhocasGnomicas(JSON.stringify(['música', 'brilho', 'chama']))).toHaveLength(3)
    expect(lerEngenhocasGnomicas(JSON.stringify(['a', 'b', 'c', 'd']))).toEqual(['a', 'b', 'c'])
    expect(lerEngenhocasGnomicas('not json')).toEqual([])
    expect(lerEngenhocasGnomicas(JSON.stringify([1, null, 'ok']))).toEqual(['ok'])
    const d = criar('Gnomo', 1, { 'esp-gnomo-linhagem': 'rochas', 'esp-gnomo-atributo-magia': 'sabedoria' })
    d.listas[CHAVE_ENGENHOCAS_GNOMO] = JSON.stringify(['Caixa de música'])
    expect(aplicarDescanso(s, d, 'longo').d.listas[CHAVE_ENGENHOCAS_GNOMO]).toBe(JSON.stringify(['Caixa de música']))
    expect(magiasDaEspecieDnd(d)?.magias.map(m => m.id)).toEqual(['mending','prestidigitation'])
  })
  it('criação apresenta escolhas de perícia para todas as 12 classes e aplica a proficiência', () => {
    expect(MARCOS_PERICIAS_CLASSE_DND.length).toBe(CLASSES_SRD.reduce((n,c) => n + c.pericias.qtd, 0))
    const d = criar('Elfo', 1, { 'guerreiro-pericia-1': 'atletismo', 'guerreiro-pericia-2': 'percepcao' })
    expect(periciasClasseDnd(d)).toEqual(['atletismo','percepcao'])
    expect(calcular(s,d).automaticos?.atletismo).toContain('Guerreiro')
    expect(calcular(s,d).automaticos?.percepcao).toContain('Guerreiro')
    expect(validarAlteracoesEscolhasDnd({ ...d, dndEscolhas: {} },d)).toEqual([])
    const vis = progressaoVisivel(MARCOS_DND_2024, progressoDaFichaDnd(d))
    expect(vis.filter(x => x.id.startsWith('guerreiro-pericia-'))).toHaveLength(2)
    expect(vis.filter(x => x.id.startsWith('guerreiro-pericia-')).every(x => x.estado === 'adquirido')).toBe(true)
    const invalido = { ...d, dndEscolhas: { 'guerreiro-pericia-1': 'atletismo','guerreiro-pericia-2': 'atletismo' } }
    expect(validarAlteracoesEscolhasDnd({ ...d, dndEscolhas: {} }, invalido).some(x => x.includes('mais de uma vez'))).toBe(true)
    const multiclasse = { ...d, campos: { ...d.campos, nivel: 2 }, dndMulticlasse: { mago: 1 } }
    const visMulti = progressaoVisivel(MARCOS_DND_2024, progressoDaFichaDnd(multiclasse))
    expect(visMulti.filter(x => x.id.startsWith('mago-pericia-'))).toHaveLength(0)
  })
})
