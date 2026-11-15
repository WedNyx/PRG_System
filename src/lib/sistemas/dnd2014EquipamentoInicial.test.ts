import {describe,it,expect} from 'vitest'
import { escolherKitInicial2014, escolherOuroInicial2014, formulaRiquezaInicial2014,
  registroEquipamentoAtual2014, rolarRiquezaInicial2014, totalRiquezaInicial2014,
  validarEquipamentoInicial2014 } from './dnd2014EquipamentoInicial'
import { fichaVazia, normalizarFicha } from './calculo'
import { avaliarProntidaoDnd } from './dndProntidao'
import { sistemaPorId } from './catalogo'
import { lerUso } from './inventario'
import { categoria } from '../nuvem/categorias'

const s=sistemaPorId('dnd5e-srd')!
const ficha=()=>{
  const d=fichaVazia(s)
  d.dndLivros={base:'phb2014',suplementos:[]}
  d.campos={...d.campos,classe:'Guerreiro',antecedente:'Soldado',especie:'Humano',subraca2014:'Humano padrão',nivel:1}
  return d
}
describe('PHB 2014: equipamento inicial sem duplicação',()=>{
  it('possui tabela de riqueza das doze classes, com Monge 5d4 PO (sem ×10)',()=>{
    const esperados: Record<string,string>={
      'Bárbaro':'2d4 × 10 PO','Bardo':'5d4 × 10 PO','Bruxo':'4d4 × 10 PO',
      'Clérigo':'5d4 × 10 PO','Druida':'2d4 × 10 PO','Feiticeiro':'3d4 × 10 PO',
      'Guerreiro':'5d4 × 10 PO','Ladino':'4d4 × 10 PO','Mago':'4d4 × 10 PO',
      'Monge':'5d4 PO','Paladino':'5d4 × 10 PO','Patrulheiro':'5d4 × 10 PO',
    }
    expect(Object.keys(esperados)).toHaveLength(12)
    for(const [classe,expressao] of Object.entries(esperados))
      expect(formulaRiquezaInicial2014(classe)?.expressao).toBe(expressao)
    expect(rolarRiquezaInicial2014('Guerreiro',()=>0)?.ouro).toBe(50)
    expect(rolarRiquezaInicial2014('Monge',()=>0.9999)?.ouro).toBe(20)
    expect(totalRiquezaInicial2014('Guerreiro',[4,4,4,4,4])).toBe(200)
  })
  it('rejeita dados falsos e arrays malformados em vez de lançar exceções',()=>{
    expect(totalRiquezaInicial2014('Guerreiro',[5,1,1,1,1])).toBeNull()
    expect(totalRiquezaInicial2014('Guerreiro',[1,1,1,1])).toBeNull()
    expect(totalRiquezaInicial2014('Guerreiro','11111')).toBeNull()
    expect(totalRiquezaInicial2014('Guerreiro',[1,1,1,1,'1'])).toBeNull()
  })
  it('ouro só preenche carteira vazia, preserva moedas e itens existentes',()=>{
    const d=ficha()
    const original={...d,uso:{itens:{},poderes:{},carteira:'30 PO e 2 PP'},itens:[{id:'a',nome:'Espada',categoria:'arma',peso:1,bonus:[]}]}
    const registrado=escolherOuroInicial2014(original,()=>0)!
    expect(registrado.uso).toEqual(original.uso)
    expect(registrado.itens).toEqual(original.itens)
    expect(registrado.dnd2014EquipamentoInicial?.dados).toEqual([1,1,1,1,1])
    const vazio=escolherOuroInicial2014(d,()=>0)!
    expect(lerUso(vazio.uso).carteira).toBe('50 PO')
    expect(vazio.itens).toEqual(d.itens)
    expect(registroEquipamentoAtual2014(vazio)).toBe(true)
    expect(normalizarFicha(s,vazio).dnd2014EquipamentoInicial).toEqual(vazio.dnd2014EquipamentoInicial)
    expect(categoria('dnd5e-srd','dnd2014EquipamentoInicial')).toBe('equipamentos')
  })
  it('kits exigem inventário e confirmação, sem conceder automaticamente objetos',()=>{
    const d=ficha()
    const selecionado=escolherKitInicial2014(d)
    expect(selecionado.itens).toEqual(d.itens)
    expect(registroEquipamentoAtual2014(selecionado)).toBe(false)
    expect(validarEquipamentoInicial2014(d,{...selecionado,dnd2014EquipamentoInicial:{...selecionado.dnd2014EquipamentoInicial!,conferido:true}},'phb2014')).toHaveLength(1)
    const comItens={...selecionado,itens:[{id:'a',nome:'Cota de malha',categoria:'armadura',peso:20,bonus:[]}]}
    const confirmado={...comItens,dnd2014EquipamentoInicial:{...selecionado.dnd2014EquipamentoInicial!,conferido:true}}
    expect(validarEquipamentoInicial2014(d,confirmado,'phb2014')).toEqual([])
    expect(registroEquipamentoAtual2014(confirmado)).toBe(true)
  })
  it('revisa equipamento se classe/antecedente mudarem e não contamina 2024',()=>{
    const base=ficha()
    const novo=escolherOuroInicial2014(base,()=>0)!
    expect(registroEquipamentoAtual2014({...novo,campos:{...novo.campos,classe:'Bardo'}})).toBe(false)
    expect(validarEquipamentoInicial2014(base,novo,'phb2024')).toHaveLength(1)
    expect(validarEquipamentoInicial2014(base,{...novo,dnd2014EquipamentoInicial:{modo:'ouro',classe:'Mago',antecedente:'Soldado',dados:[1,1,1,1]}},'phb2014')).toHaveLength(1)
    expect(avaliarProntidaoDnd({...novo,campos:{...novo.campos,classe:'Mago'}},'phb2014')
      .pendencias.some(p=>p.id==='equipamentoInicial2014')).toBe(true)
  })
})
