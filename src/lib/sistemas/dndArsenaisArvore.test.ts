import { describe, expect, it } from 'vitest'
import { ARMAS_DND_2014, armaDndPorIdEdicao } from './dnd2014Armas'
import { ARMAS_DND_2024, expressaoDanoArmaDnd } from './dnd2024Armas'
import { ARMAS_DND_EXPANDIDAS } from './dnd2024ArmasExpandidas'
import { arsenaisPermitidosDnd, fonteDeReferenciaArma, referenciaPertenceAoLivro, rotuloArsenalDnd } from './dndArsenais'
import { hexagonosOficiaisDnd } from './arvoreDndOficial'
import { sistemaPorId } from './catalogo'
import { fichaVazia } from './calculo'
import { FONTE_PHB, fontesLiberadas } from './dnd2024Fontes'

const dnd = sistemaPorId('dnd5e-srd')!

describe('Arsenal por edição e obra autorizada', () => {
  it('mantém as tabelas principais de 2014 e 2024 independentes, sem inventar maestrias em 2014', () => {
    expect(ARMAS_DND_2014).toHaveLength(37)
    expect(ARMAS_DND_2024).toHaveLength(38)
    expect(ARMAS_DND_2014.every(a => a.id.startsWith('2014-') && a.maestria === '')).toBe(true)
    expect(ARMAS_DND_2014.some(a => a.id === '2014-rede')).toBe(true)
    expect(ARMAS_DND_2014.some(a => a.nome === 'Mosquete' || a.nome === 'Pistola')).toBe(false)
    expect(ARMAS_DND_2024.some(a => a.id === '2014-rede')).toBe(false)
  })
  it('usa danos, peso e dados críticos próprios das edições e não inventa dano para a Rede', () => {
    expect(armaDndPorIdEdicao('2014-lanca-cavalaria')?.dano).toBe('1d12')
    expect(armaDndPorIdEdicao('lanca-cavalaria')?.dano).toBe('1d10')
    expect(armaDndPorIdEdicao('2014-tridente')?.dano).toBe('1d6')
    expect(armaDndPorIdEdicao('tridente')?.dano).toBe('1d8')
    expect(armaDndPorIdEdicao('2014-picareta-guerra')?.versatil).toBeUndefined()
    expect(armaDndPorIdEdicao('2014-martelo-guerra')?.pesoLb).toBe(2)
    expect(armaDndPorIdEdicao('2014-rede')?.dano).toBe('')
    const arma = armaDndPorIdEdicao('2014-lanca-cavalaria')!
    expect(expressaoDanoArmaDnd(arma,3)).toBe('1d12+3')
    expect(expressaoDanoArmaDnd(arma,3,true)).toBe('2d12+3')
    const tridente = armaDndPorIdEdicao('2014-tridente')!
    expect(expressaoDanoArmaDnd(tridente,2,true,true)).toBe('2d8+2')
  })
  it('só mostra fontes selecionadas e compatíveis: PHB 2014, PHB 2024, DMGs e suplementos', () => {
    expect(arsenaisPermitidosDnd('phb2014',[])).toEqual(['phb2014'])
    expect(arsenaisPermitidosDnd('phb2024',[])).toEqual(['phb2024'])
    expect(arsenaisPermitidosDnd('phb2024',['phb2014','dmg2024','xanathar2017','inventado']))
      .toEqual(['phb2024','phb2014','dmg2024','xanathar2017'])
    expect(arsenaisPermitidosDnd('phb2014',['dmg2024','dmg2014','tasha2020']))
      .toEqual(['phb2014','dmg2014','tasha2020'])
    expect(rotuloArsenalDnd('phb2014')).toContain('2014')
    expect(rotuloArsenalDnd('phb2024')).toContain('2024')
    expect(rotuloArsenalDnd('tasha2020')).toContain('2020')
  })
  it('liga referências apenas a obras verificadas, sem divulgar itens de índices não confirmados', () => {
    const tasha = ARMAS_DND_EXPANDIDAS.find(a => a.livro === 'Tasha’s Cauldron of Everything')!
    const misto = ARMAS_DND_EXPANDIDAS.find(a => a.livro === 'Dungeon Master’s Guide 2014 / 2024')!
    const indice = ARMAS_DND_EXPANDIDAS.find(a => a.classe === 'indice')!
    expect(fonteDeReferenciaArma(tasha)).toBe('tasha2020')
    expect(referenciaPertenceAoLivro(tasha,'tasha2020')).toBe(true)
    expect(referenciaPertenceAoLivro(tasha,'phb2024')).toBe(false)
    expect(referenciaPertenceAoLivro(misto,'dmg2014')).toBe(true)
    expect(referenciaPertenceAoLivro(misto,'dmg2024')).toBe(true)
    expect(fonteDeReferenciaArma(indice)).toBeNull()
    expect(referenciaPertenceAoLivro(indice,'dmg2024')).toBe(false)
  })
})

describe('Hexágonos naturais da ficha D&D', () => {
  it('gera classe, raça e origem/antecedente conforme a ficha 2024 sem gastar pontos nem escrever poderes', () => {
    const d=fichaVazia(dnd)
    d.campos={...d.campos,classe:'Guerreiro',especie:'Anão',antecedente:'Acólito',nivel:1}
    const anterior=JSON.stringify(d)
    const h=hexagonosOficiaisDnd(d,'phb2024',fontesLiberadas([]))
    expect(h.some(n=>n.ramo==='classe')).toBe(true)
    expect(h.some(n=>n.ramo==='especie')).toBe(true)
    expect(h.some(n=>n.ramo==='antecedente')).toBe(true)
    expect(h.some(n=>n.estado==='recebido')).toBe(true)
    expect(h.some(n=>n.estado==='futuro')).toBe(false)
    expect(new Set(h.map(n=>n.id)).size).toBe(h.length)
    expect(JSON.stringify(d)).toBe(anterior)
  })
  it('aumenta ou exibe hexágonos futuros por nível, sem transformar escolhas pendentes em ganhos', () => {
    const d=fichaVazia(dnd)
    d.campos={...d.campos,classe:'Guerreiro',especie:'Elfo',antecedente:'Soldado',nivel:1}
    const h1=hexagonosOficiaisDnd(d,'phb2024',fontesLiberadas([]))
    const futuros=hexagonosOficiaisDnd(d,'phb2024',fontesLiberadas([]),true)
    expect(futuros.length).toBeGreaterThan(h1.length)
    expect(futuros.some(n=>n.estado==='futuro')).toBe(true)
    expect(h1.some(n=>n.estado==='pendente')).toBe(true)
    d.campos.nivel=5
    const h5=hexagonosOficiaisDnd(d,'phb2024',fontesLiberadas([]))
    expect(h5.length).toBeGreaterThan(h1.length)
  })
  it('em 2014, apresenta as origens legadas como referências manuais, sem importar progressão 2024', () => {
    const d=fichaVazia(dnd)
    d.campos={...d.campos,classe:'Guerreiro',especie:'Elfo',subraca2014:'Alto Elfo',antecedente:'Forasteiro',nivel:5}
    d.dndLivros={base:'phb2014',suplementos:['tasha2020']}
    const h=hexagonosOficiaisDnd(d,'phb2014')
    expect(h).toHaveLength(4)
    expect(h.every(x=>x.estado==='referencia' && x.livro.includes('2014'))).toBe(true)
    expect(h.map(x=>x.titulo)).toContain('Alto Elfo')
    expect(h.map(x=>x.titulo)).toContain('Antecedente: Forasteiro')
  })
  it('características comerciais são referência e somem quando o livro não é permitido', () => {
    const d=fichaVazia(dnd)
    d.campos={...d.campos,classe:'Guerreiro',especie:'Aasimar',antecedente:'Soldado',nivel:3}
    const fechado=hexagonosOficiaisDnd(d,'phb2024',fontesLiberadas([]))
    const aberto=hexagonosOficiaisDnd(d,'phb2024',fontesLiberadas([FONTE_PHB]))
    expect(fechado.some(n=>n.livro.startsWith('Livro'))).toBe(false)
    expect(aberto.some(n=>n.estado==='referencia')).toBe(true)
    expect(aberto.some(n=>n.ramo==='especie')).toBe(true)
  })
})
