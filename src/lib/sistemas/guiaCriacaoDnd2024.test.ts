import { describe, expect, it } from 'vitest'
import { etapasCriacaoDnd2024 } from './guiaCriacaoDnd2024'
import { fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'

const nova = () => fichaVazia(sistemaPorId('dnd5e-srd')!)
describe('guia de criação D&D 2024', () => {
  it('aponta etapas ainda não preenchidas sem marcar ficha como pronta', () => {
    const e = etapasCriacaoDnd2024(nova())
    expect(e.find(x => x.id === 'classe')?.estado).toBe('pendente')
    expect(e.find(x => x.id === 'revisao')?.estado).toBe('revisar')
  })
  it('mostra classe e espécie registradas, mas mantém revisão de proficiências', () => {
    const d = nova()
    d.nome = 'Exemplo'
    d.campos = { ...d.campos, classe: 'Guerreiro', especie: 'Elfo', antecedente: 'Soldado', nivel: 3 }
    d.atributos = { ...d.atributos, FOR: 15 }
    const e = etapasCriacaoDnd2024(d)
    expect(e.find(x => x.id === 'classe')?.estado).toBe('registrado')
    expect(e.find(x => x.id === 'especie')?.estado).toBe('registrado')
    expect(e.find(x => x.id === 'proficiencias')?.estado).toBe('revisar')
    expect(e.find(x => x.id === 'habilidades')?.estado).toBe('pendente')
  })
  it('não considera o Elfo completo sem linhagem, perícia e atributo de conjuração', () => {
    const d = nova()
    d.campos = { ...d.campos, classe: 'Guerreiro', especie: 'Elfo', antecedente: 'Soldado', nivel: 1 }
    expect(etapasCriacaoDnd2024(d).find(x => x.id === 'especie')?.estado).toBe('pendente')
    d.dndEscolhas = {
      'esp-elfo-linhagem': 'alto-elfo',
      'esp-elfo-sentidos': 'percepcao',
      'esp-elfo-atributo-magia': 'inteligencia',
    }
    expect(etapasCriacaoDnd2024(d).find(x => x.id === 'especie')?.estado).toBe('registrado')
    expect(etapasCriacaoDnd2024(d).find(x => x.id === 'magias')?.estado).toBe('revisar')
  })
  it('marca antecedentes preenchidos como revisão, não como concluídos automaticamente', () => {
    const d = nova()
    d.campos = { ...d.campos, classe: 'Guerreiro', antecedente: 'Soldado', nivel: 1 }
    expect(etapasCriacaoDnd2024(d).find(x => x.id === 'antecedente')?.estado).toBe('revisar')
  })
  it('cobra a escolha de perícia e talento do Humano', () => {
    const d = nova()
    d.campos = { ...d.campos, classe: 'Guerreiro', especie: 'Humano', nivel: 1 }
    const etapa = etapasCriacaoDnd2024(d).find(x => x.id === 'especie')
    expect(etapa?.estado).toBe('pendente')
    expect(etapa?.descricao).toContain('Habilidoso')
    d.dndEscolhas = { 'esp-humano-tamanho': 'medio', 'esp-humano-habilidoso': 'percepcao', 'esp-humano-versatil': 'alerta' }
    expect(etapasCriacaoDnd2024(d).find(x => x.id === 'especie')?.estado).toBe('registrado')
  })
  it('não exige magias de classe sem conjuração no primeiro nível', () => {
    const d = nova()
    d.campos = { ...d.campos, classe: 'Guerreiro', nivel: 1 }
    expect(etapasCriacaoDnd2024(d).find(x => x.id === 'magias')?.estado).toBe('nao-aplica')
  })
})
