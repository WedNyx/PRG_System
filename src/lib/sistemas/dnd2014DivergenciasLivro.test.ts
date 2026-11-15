import { describe, expect, it } from 'vitest'
import { ARMAS_DND_2014 } from './dnd2014Armas'
import { ARMAS_DND_2024, pesoEmKgArmaDnd } from './dnd2024Armas'
import { ANTECEDENTES_2014 } from './dnd2014Criacao'
import { validarAlteracoes2014 } from './dnd2014Regras'
import { validarSubclasseDnd2014, subclasseDaFicha2014 } from './dnd2014Subclasses'
import { hexagonosOficiaisDnd } from './arvoreDndOficial'
import { classesDaFicha2014, espacosDeMagia2014 } from './dnd2014Multiclasse'
import { maximoNivelMagiaClasse2014, validarAlteracoesMagias2014 } from './dnd2014Magias'
import { fichaVazia, normalizarFicha } from './calculo'
import { sistemaPorId } from './catalogo'

const s = sistemaPorId('dnd5e-srd')!
function personagem() {
  const d = fichaVazia(s)
  d.dndLivros = { base:'phb2014', suplementos:[] }
  d.campos = {...d.campos, classe:'Mago', especie:'Elfo', subraca2014:'Alto Elfo', antecedente:'Forasteiro', nivel:9}
  d.dnd2014Subclasse = 'evocacao' // Mago 2
  d.dnd2014Multiclasse = {guerreiro:7} // Guerreiro 7 / Mago 2
  d.dnd2014Subclasses = {guerreiro:'cavaleiro-arcano'} // Guerreiro 3
  return d
}

describe('PHB 2014, divergências documentadas na Etapa 1', () => {
  it('clava grande: Pesada, duas mãos e preço 2 PP, sem mudar arsenal 2024', () => {
    const antiga = ARMAS_DND_2014.find(a => a.id==='2014-clava-grande')!
    const nova = ARMAS_DND_2024.find(a => a.id==='clava-grande')!
    expect(antiga.propriedades).toEqual(['Pesada','Duas mãos'])
    expect(antiga.preco).toBe('2 PP')
    expect(antiga.dano).toBe('1d8')
    expect(antiga.maestria).toBe('')
    expect(nova.propriedades).toEqual(['Duas mãos'])
    expect(nova.maestria).toBe('Push')
  })
  it('Lança Longa: 4 kg no livro traduzido; arma 2024 conserva seu peso e id', () => {
    const antiga=ARMAS_DND_2014.find(a=>a.id==='2014-pique')!
    const nova=ARMAS_DND_2024.find(a=>a.id==='pique')!
    expect(antiga.dano).toBe('1d10')
    expect(antiga.propriedades).toContain('Pesada')
    expect(pesoEmKgArmaDnd(antiga)).toBe(4)
    expect(pesoEmKgArmaDnd(nova)).toBeGreaterThan(8)
  })
  it('Forasteiro 2014 identifica a característica Andarilho, sem mudar perícias', () => {
    const f=ANTECEDENTES_2014.find(x=>x.nome==='Forasteiro')!
    expect(f.descricao).toContain('Andarilho')
    expect(f.descricao).toContain('Atletismo')
    expect(f.descricao).toContain('Sobrevivência')
  })
  it('trocar raça sem limpar sub-raça antiga é rejeitado na combinação final', () => {
    const d=personagem()
    const incorreta={...d, campos:{...d.campos, especie:'Anão'}}
    expect(validarAlteracoes2014(d,incorreta,'phb2014')).toContain('Sub-raça incompatível com a raça do Livro do Jogador 2014.')
    const rascunho={...d,campos:{...d.campos,especie:'Anão',subraca2014:''}}
    expect(validarAlteracoes2014(d,rascunho,'phb2014')).toEqual([])
  })
  it('subclasse de cada classe usa seu nível, preservando o campo da classe inicial', () => {
    const d=personagem()
    expect(subclasseDaFicha2014(d,'mago')?.id).toBe('evocacao')
    expect(subclasseDaFicha2014(d,'guerreiro')?.id).toBe('cavaleiro-arcano')
    expect(validarSubclasseDnd2014({...d,dnd2014Subclasses:{}},d)).toEqual([])
    const velha={...d,dnd2014Subclasses:undefined}
    expect(subclasseDaFicha2014(velha,'mago')?.id).toBe('evocacao')
    expect(subclasseDaFicha2014(velha,'guerreiro')).toBeNull()
    expect(normalizarFicha(s,d).dnd2014Subclasses).toEqual({guerreiro:'cavaleiro-arcano'})
    const nos=hexagonosOficiaisDnd(d,'phb2014')
    expect(nos.some(x=>x.id==='2014-subclasse'&&x.titulo==='Escola de Evocação')).toBe(true)
    expect(nos.some(x=>x.id==='2014-subclasse-guerreiro'&&x.titulo==='Cavaleiro Arcano')).toBe(true)
  })
  it('não permite escolher subclasse por nível TOTAL, nem armazenar uma para classe inexistente', () => {
    const d=personagem()
    const baixo={...d,campos:{...d.campos,nivel:4},dnd2014Multiclasse:{guerreiro:2}}
    expect(validarSubclasseDnd2014(d,baixo).length).toBeGreaterThan(0)
    const falso={...d,dnd2014Subclasses:{paladino:'devocao'}}
    expect(validarSubclasseDnd2014(d,falso).length).toBeGreaterThan(0)
    const repetido={...d,dnd2014Subclasses:{mago:'evocacao'}}
    expect(validarSubclasseDnd2014(d,repetido).length).toBeGreaterThan(0)
    const revisada={...d,dndLivros:{base:'phb2024' as const,suplementos:[]}}
    expect(validarAlteracoes2014(d,revisada,'phb2024')).toEqual([])
    expect(validarAlteracoes2014(d,{...revisada,dnd2014Subclasses:{guerreiro:'campeao'}},'phb2024').length).toBeGreaterThan(0)
  })
  it('Cavaleiro Arcano secundário participa dos espaços de magia, sem usar nível total', () => {
    const d=personagem()
    const c=classesDaFicha2014(d)
    const esp=espacosDeMagia2014(c.lista,d.dnd2014Subclasse,d.dnd2014Subclasses)
    expect(esp.nivelConjurador).toBe(4) // Mago 2 + Guerreiro 7/3 (arredonda p/ baixo)
    expect(maximoNivelMagiaClasse2014('Guerreiro',7,subclasseDaFicha2014(d,'guerreiro')?.id)).toBe(2)
    d.dnd2014Magias=[{id:'mis',nome:'Mísseis Mágicos',nivel:1,classe:'guerreiro',fonte:'phb2014',modo:'conhecida'}]
    expect(validarAlteracoesMagias2014({...d,dnd2014Magias:[]},d,'phb2014')).toEqual([])
  })
})
